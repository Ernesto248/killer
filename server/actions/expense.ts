"use server";
import { createExpense } from "@/lib/domain/expense";
import { revalidatePath } from "next/cache";

export async function createExpenseAction(input: Parameters<typeof createExpense>[0]) {
  const r = await createExpense(input);
  revalidatePath("/gastos");
  return r;
}
