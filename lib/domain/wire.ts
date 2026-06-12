import { db } from "@/lib/db";
import { cuadreTirada, wire, wireSplit, wireBuyer, wireBuyerBalance, account, accountMovement } from "@/lib/db/schema";
import { eq, isNull, asc, sql } from "drizzle-orm";

export type TiradaForFifo = { id: number; usd: number; tasa: number; date: Date };

export type FifoResult = {
  consumed: Array<{ id: number; usd: number; tasa: number }>;
  remainingTirada: { id: number; usd: number; tasa: number; splitFrom: number } | null;
  totalCup: number;
  tasaPromedio: number;
};

export function computeFifoConsumption(tiradas: TiradaForFifo[], targetUsd: number): FifoResult {
  let remaining = targetUsd;
  let totalCup = 0;
  const consumed: FifoResult["consumed"] = [];
  let remainingTirada: FifoResult["remainingTirada"] = null;

  for (const t of tiradas) {
    if (remaining <= 0) break;
    const usar = Math.min(t.usd, remaining);
    consumed.push({ id: t.id, usd: usar, tasa: t.tasa });
    totalCup += usar * t.tasa;
    remaining -= usar;
    if (usar < t.usd) {
      remainingTirada = { id: t.id, usd: t.usd - usar, tasa: t.tasa, splitFrom: t.id };
    }
  }

  if (remaining > 0) {
    throw new Error("No hay suficientes USD disponibles en tiradas para cubrir el wire");
  }

  return { consumed, remainingTirada, totalCup, tasaPromedio: totalCup / targetUsd };
}

export type WireSplitInput = { destinoAccountId: number; usdAmount: number; tasaDestino: number };

export type CreateWireInput = {
  wireBuyerName: string;
  date: Date;
  usdAmount: number;
  tasaCup: number;
  splits: WireSplitInput[];
  nota?: string;
};

export async function createWire(input: CreateWireInput) {
  const totalSplitUsd = input.splits.reduce((a, s) => a + s.usdAmount, 0);
  if (Math.abs(totalSplitUsd - input.usdAmount) > 0.01) {
    throw new Error(`Split USD (${totalSplitUsd}) no coincide con usdAmount (${input.usdAmount})`);
  }

  return db.transaction(async (tx) => {
    let [wb] = await tx.select().from(wireBuyer).where(eq(wireBuyer.name, input.wireBuyerName));
    if (!wb) {
      [wb] = await tx.insert(wireBuyer).values({ name: input.wireBuyerName }).returning();
    }

    const [llcAccount] = await tx.select().from(account).where(eq(account.type, "llc_usa"));
    if (!llcAccount) throw new Error("Cuenta LLC USA no encontrada");

    const tiradas = await tx
      .select()
      .from(cuadreTirada)
      .where(isNull(cuadreTirada.consumedByWireId))
      .orderBy(asc(cuadreTirada.date), asc(cuadreTirada.id))
      .for("update");

    const tiradasForFifo = tiradas.map((t) => ({ id: t.id, usd: Number(t.usd), tasa: Number(t.tasa), date: t.date }));
    const fifo = computeFifoConsumption(tiradasForFifo, input.usdAmount);

    let ganancia = 0;
    for (const split of input.splits) {
      ganancia += split.usdAmount * (split.tasaDestino - fifo.tasaPromedio);
    }

    const cupTotal = input.usdAmount * input.tasaCup;
    const [w] = await tx.insert(wire).values({
      wireBuyerId: wb.id,
      date: input.date,
      usdAmount: String(input.usdAmount),
      tasaCup: String(input.tasaCup),
      cupTotal: String(cupTotal),
      gananciaEstimadaCup: String(ganancia),
      nota: input.nota,
    }).returning();

    for (const s of input.splits) {
      await tx.insert(wireSplit).values({
        wireId: w.id,
        destinoAccountId: s.destinoAccountId,
        usdAmount: String(s.usdAmount),
        tasaDestino: String(s.tasaDestino),
        cupRecibido: String(s.usdAmount * s.tasaDestino),
      });
    }

    for (const c of fifo.consumed) {
      const original = tiradas.find((t) => t.id === c.id)!;
      if (Math.abs(c.usd - Number(original.usd)) < 0.01) {
        await tx.update(cuadreTirada).set({ consumedByWireId: w.id, consumedAt: new Date() }).where(eq(cuadreTirada.id, c.id));
      } else {
        await tx.update(cuadreTirada).set({ consumedByWireId: w.id, consumedAt: new Date() }).where(eq(cuadreTirada.id, c.id));
        const rest = Number(original.usd) - c.usd;
        await tx.insert(cuadreTirada).values({
          cuadreId: original.cuadreId,
          remeseroId: original.remeseroId,
          date: original.date,
          usd: String(rest),
          tasa: original.tasa,
          cupEquivalente: String(rest * Number(original.tasa)),
        });
      }
    }

    await tx.insert(accountMovement).values({
      accountId: llcAccount.id,
      date: input.date,
      amount: String(-input.usdAmount),
      currency: "USD",
      refType: "wire",
      refId: w.id,
    });

    for (const s of input.splits) {
      const [dest] = await tx.select().from(account).where(eq(account.id, s.destinoAccountId));
      const amount = dest.currency === "USD" ? s.usdAmount : s.usdAmount * s.tasaDestino;
      await tx.insert(accountMovement).values({
        accountId: dest.id,
        date: input.date,
        amount: String(amount),
        currency: dest.currency,
        refType: "wire_split",
        refId: w.id,
        note: `Wire #${w.id}`,
      });
    }

    await tx.insert(wireBuyerBalance).values({
      wireBuyerId: wb.id,
      balanceCup: String(cupTotal),
    }).onConflictDoUpdate({
      target: wireBuyerBalance.wireBuyerId,
      set: { balanceCup: sql`${wireBuyerBalance.balanceCup} + ${cupTotal}`, updatedAt: new Date() },
    });

    return { wireId: w.id, ganancia, cupTotal };
  });
}
