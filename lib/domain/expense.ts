import { db } from "@/lib/db";
import { operationalExpense, account, accountMovement } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const expenseInputSchema = z.object({
  date: z.date(),
  categoryId: z.number().int(),
  description: z.string().min(1),
  cupAmount: z.number().min(0).default(0),
  usdAmount: z.number().min(0).default(0),
  note: z.string().optional(),
}).refine((d) => (d.cupAmount > 0) !== (d.usdAmount > 0), { message: "Debe tener un solo monto positivo (CUP o USD)" });

export async function createExpense(input: z.infer<typeof expenseInputSchema>) {
  const parsed = expenseInputSchema.parse(input);
  const currency = parsed.cupAmount > 0 ? "CUP" : "USD";
  const amount = parsed.cupAmount > 0 ? parsed.cupAmount : parsed.usdAmount;

  return db.transaction(async (tx) => {
    const [from] = await tx.select().from(account).where(eq(account.type, currency === "CUP" ? "efectivo_cup" : "efectivo_usd"));
    const fromId = from?.id ?? null;

    const [e] = await tx.insert(operationalExpense).values({
      date: parsed.date,
      categoryId: parsed.categoryId,
      description: parsed.description,
      cupAmount: String(parsed.cupAmount),
      usdAmount: String(parsed.usdAmount),
      fromAccountId: fromId,
      note: parsed.note,
    }).returning();

    if (fromId) {
      await tx.insert(accountMovement).values({
        accountId: fromId,
        date: parsed.date,
        amount: String(-amount),
        currency,
        refType: "expense",
        refId: e.id,
        note: parsed.description,
      });
    }
    return e;
  });
}
