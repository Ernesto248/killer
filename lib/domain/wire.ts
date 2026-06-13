import { db } from "@/lib/db";
import { cuadreTirada, wire, wireBuyer, wireBuyerBalance, account, accountMovement } from "@/lib/db/schema";
import { eq, isNull, asc, sql } from "drizzle-orm";

export type CreateWireInput = {
  wireBuyerName: string;
  date: Date;
  usdAmount: number;
  tasa: number;
  monedaDestino: "CUP" | "USD";
  fromAccountId: number;
  toAccountId: number;
  nota?: string;
};

function computeFifoConsumption(tiradas: Array<{ id: number; usd: number; tasa: number; date: Date }>, targetUsd: number) {
  let remaining = targetUsd;
  let totalCup = 0;
  const consumed: Array<{ id: number; usd: number; tasa: number }> = [];

  for (const t of tiradas) {
    if (remaining <= 0) break;
    const usar = Math.min(t.usd, remaining);
    consumed.push({ id: t.id, usd: usar, tasa: t.tasa });
    totalCup += usar * t.tasa;
    remaining -= usar;
  }
  if (remaining > 0) throw new Error("No hay suficientes USD disponibles en tiradas para cubrir el wire");
  return { consumed, totalCup, tasaPromedio: totalCup / targetUsd };
}

export async function createWire(input: CreateWireInput) {
  return db.transaction(async (tx) => {
    let [wb] = await tx.select().from(wireBuyer).where(eq(wireBuyer.name, input.wireBuyerName));
    if (!wb) [wb] = await tx.insert(wireBuyer).values({ name: input.wireBuyerName }).returning();

    const [fromAcc] = await tx.select().from(account).where(eq(account.id, input.fromAccountId));
    if (!fromAcc) throw new Error("Cuenta origen no encontrada");
    const [toAcc] = await tx.select().from(account).where(eq(account.id, input.toAccountId));
    if (!toAcc) throw new Error("Cuenta destino no encontrada");

    const tasaCup = input.monedaDestino === "CUP" ? input.tasa : 1;
    const cupTotal = input.usdAmount * tasaCup;
    const destinoAmount = input.monedaDestino === "USD"
      ? input.usdAmount * (1 + input.tasa / 100)
      : cupTotal;

    const tiradas = await tx.select().from(cuadreTirada)
      .where(isNull(cuadreTirada.consumedByWireId))
      .orderBy(asc(cuadreTirada.date), asc(cuadreTirada.id))
      .for("update");
    const tiradasForFifo = tiradas.map((t) => ({ id: t.id, usd: Number(t.usd), tasa: Number(t.tasa), date: t.date }));
    const fifo = computeFifoConsumption(tiradasForFifo, input.usdAmount);

    let ganancia = 0;
    if (input.monedaDestino === "CUP") {
      ganancia = input.usdAmount * (input.tasa - fifo.tasaPromedio);
    } else {
      ganancia = input.usdAmount * (input.tasa / 100) * tasaCup;
    }

    const [w] = await tx.insert(wire).values({
      wireBuyerId: wb.id, date: input.date,
      usdAmount: String(input.usdAmount),
      tasaCup: String(input.tasa),
      cupTotal: String(cupTotal),
      gananciaEstimadaCup: String(ganancia),
      nota: input.nota,
    }).returning();

    for (const c of fifo.consumed) {
      const original = tiradas.find((t) => t.id === c.id)!;
      if (Math.abs(c.usd - Number(original.usd)) < 0.01) {
        await tx.update(cuadreTirada).set({ consumedByWireId: w.id, consumedAt: new Date() }).where(eq(cuadreTirada.id, c.id));
      } else {
        await tx.update(cuadreTirada).set({ consumedByWireId: w.id, consumedAt: new Date() }).where(eq(cuadreTirada.id, c.id));
        const rest = Number(original.usd) - c.usd;
        await tx.insert(cuadreTirada).values({
          cuadreId: original.cuadreId, remeseroId: original.remeseroId, date: original.date,
          usd: String(rest), tasa: original.tasa, cupEquivalente: String(rest * Number(original.tasa)),
        });
      }
    }

    await tx.insert(accountMovement).values({
      accountId: fromAcc.id, date: input.date,
      amount: String(-input.usdAmount), currency: "USD", refType: "wire", refId: w.id,
    });
    await tx.insert(accountMovement).values({
      accountId: toAcc.id, date: input.date,
      amount: String(destinoAmount),
      currency: toAcc.currency, refType: "wire", refId: w.id,
      note: `Wire #${w.id}`,
    });

    await tx.insert(wireBuyerBalance).values({ wireBuyerId: wb.id, balanceCup: String(cupTotal) })
      .onConflictDoUpdate({
        target: wireBuyerBalance.wireBuyerId,
        set: { balanceCup: sql`${wireBuyerBalance.balanceCup} + ${cupTotal}`, updatedAt: new Date() },
      });

    return { wireId: w.id, ganancia, cupTotal };
  });
}
