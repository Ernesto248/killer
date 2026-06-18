import { db } from "@/lib/db";
import { currencyExchange } from "@/lib/db/schema";

export type ExchangeInput = {
  date: Date;
  direction: "compra_usd" | "venta_usd";
  usdAmount: number;
  tasa: number;
  note?: string;
};

export async function createExchange(input: ExchangeInput) {
  const cupAmount = input.usdAmount * input.tasa;
  const [e] = await db.insert(currencyExchange).values({
    date: input.date,
    direction: input.direction,
    usdAmount: String(input.usdAmount),
    tasa: String(input.tasa),
    cupAmount: String(cupAmount),
    fromAccountId: 1,
    toAccountId: 1,
    note: input.note,
  }).returning();
  return e;
}
