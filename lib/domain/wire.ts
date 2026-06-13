import { db } from "@/lib/db";
import { wire, wireBuyer, wireBuyerBalance, wirePayment, account, accountMovement } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type CreateWireInput = {
  wireBuyerName: string;
  date: Date;
  usdAmount: number;
  tasa: number;
  monedaDestino: "CUP" | "USD";
  fromAccountId: number;
  toAccountId: number;
  pagado?: number;
  nota?: string;
};

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

    const [w] = await tx.insert(wire).values({
      wireBuyerId: wb.id, date: input.date,
      usdAmount: String(input.usdAmount),
      tasaCup: String(input.tasa),
      cupTotal: String(cupTotal),
      gananciaEstimadaCup: null,
      nota: input.nota,
    }).returning();

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

    if (input.pagado && input.pagado > 0) {
      await tx.insert(wirePayment).values({
        wireId: w.id, wireBuyerId: wb.id,
        date: input.date,
        cupAmount: String(input.pagado),
        note: "Pago inicial",
      });
      await tx.update(wireBuyerBalance)
        .set({ balanceCup: sql`${wireBuyerBalance.balanceCup} - ${input.pagado}`, updatedAt: new Date() })
        .where(eq(wireBuyerBalance.wireBuyerId, wb.id));
      const [cupAcc] = await tx.select().from(account).where(eq(account.type, "efectivo_cup"));
      if (cupAcc) {
        await tx.insert(accountMovement).values({
          accountId: cupAcc.id, date: input.date,
          amount: String(input.pagado), currency: "CUP",
          refType: "wire_payment", refId: w.id, note: "Pago inicial",
        });
      }
    }

    return { wireId: w.id, cupTotal };
  });
}
