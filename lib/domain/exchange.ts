import { db } from "@/lib/db";
import { currencyExchange, account, accountMovement } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type ExchangeInput = {
  date: Date;
  direction: "compra_usd" | "venta_usd";
  usdAmount: number;
  tasa: number;
  note?: string;
};

export async function createExchange(input: ExchangeInput) {
  const cupAmount = input.usdAmount * input.tasa;
  return db.transaction(async (tx) => {
    const [cupAcc] = await tx.select().from(account).where(eq(account.type, "efectivo_cup"));
    const [usdAcc] = await tx.select().from(account).where(eq(account.type, "efectivo_usd"));
    if (!cupAcc || !usdAcc) throw new Error("Cuentas CUP/USD Físico no encontradas");

    const from = input.direction === "compra_usd" ? cupAcc : usdAcc;
    const to = input.direction === "compra_usd" ? usdAcc : cupAcc;

    const [e] = await tx.insert(currencyExchange).values({
      date: input.date,
      direction: input.direction,
      usdAmount: String(input.usdAmount),
      tasa: String(input.tasa),
      cupAmount: String(cupAmount),
      fromAccountId: from.id,
      toAccountId: to.id,
      note: input.note,
    }).returning();

    await tx.insert(accountMovement).values({
      accountId: from.id, date: input.date,
      amount: String(-(from.currency === "USD" ? input.usdAmount : cupAmount)),
      currency: from.currency, refType: "exchange", refId: e.id,
    });
    await tx.insert(accountMovement).values({
      accountId: to.id, date: input.date,
      amount: String(to.currency === "USD" ? input.usdAmount : cupAmount),
      currency: to.currency, refType: "exchange", refId: e.id,
    });

    return e;
  });
}
