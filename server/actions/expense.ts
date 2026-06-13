"use server";
import { createExpense } from "@/lib/domain/expense";
import { redirect } from "next/navigation";

export async function createExpenseAction(input: Parameters<typeof createExpense>[0]) {
  const r = await createExpense(input);
  redirect("/gastos");
  return r;
}
