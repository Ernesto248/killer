import { db } from "@/lib/db";
import { cuadre, cuadreTirada, remesero, remeseroBalance, account, accountMovement } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type CuadreInput = {
  remeseroName: string;
  date: Date;
  balanceInicialCup?: number;
  pagadoCup: number;
  pendientes?: { usd: number; tasa: number };
  tirado?: Array<{ usd: number; tasa: number }>;
  balanceFinalCup: number;
  balanceFinalLabel: "deuda" | "fondo";
  rawText: string;
};

export async function registrarCuadre(input: CuadreInput) {
  return db.transaction(async (tx) => {
    let [r] = await tx.select().from(remesero).where(eq(remesero.name, input.remeseroName));
    if (!r) {
      [r] = await tx.insert(remesero).values({ name: input.remeseroName }).returning();
    }

    const [cupAccount] = await tx.select().from(account).where(eq(account.type, "efectivo_cup"));
    if (!cupAccount) throw new Error("Cuenta CUP Fisico no encontrada");

    const [c] = await tx.insert(cuadre).values({
      remeseroId: r.id,
      date: input.date,
      balanceInicialCup: String(input.balanceInicialCup ?? 0),
      pagadoCup: String(input.pagadoCup),
      pendientesUsd: String(input.pendientes?.usd ?? 0),
      pendientesTasa: input.pendientes?.tasa ? String(input.pendientes.tasa) : null,
      tiradoItems: (input.tirado ?? []).map((t) => ({ usd: String(t.usd), tasa: String(t.tasa) })),
      balanceFinalCup: String(input.balanceFinalCup),
      balanceFinalLabel: input.balanceFinalLabel,
      rawText: input.rawText,
    }).returning();

    if (input.tirado && input.tirado.length > 0) {
      await tx.insert(cuadreTirada).values(
        input.tirado.map((t) => ({
          cuadreId: c.id,
          remeseroId: r.id,
          date: input.date,
          usd: String(t.usd),
          tasa: String(t.tasa),
          cupEquivalente: String(t.usd * t.tasa),
        }))
      );
    }

    await tx.insert(remeseroBalance).values({
      remeseroId: r.id,
      balanceCup: String(input.balanceFinalCup),
      lastCuadreAt: input.date,
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: {
        balanceCup: String(input.balanceFinalCup),
        lastCuadreAt: input.date,
        updatedAt: new Date(),
      },
    });

    if (input.pagadoCup > 0) {
      await tx.insert(accountMovement).values({
        accountId: cupAccount.id,
        date: input.date,
        amount: String(-input.pagadoCup),
        currency: "CUP",
        refType: "cuadre",
        refId: c.id,
        note: `Pago a ${input.remeseroName}`,
      });
    }

    return { cuadreId: c.id, remeseroId: r.id };
  });
}
