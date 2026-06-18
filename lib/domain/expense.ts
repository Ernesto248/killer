import { db } from "@/lib/db";
import { operationalExpense } from "@/lib/db/schema";
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
  const [e] = await db.insert(operationalExpense).values({
    date: parsed.date,
    categoryId: parsed.categoryId,
    description: parsed.description,
    cupAmount: String(parsed.cupAmount),
    usdAmount: String(parsed.usdAmount),
    note: parsed.note,
  }).returning();
  return e;
}
