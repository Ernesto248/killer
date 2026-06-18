"use server";
import { db } from "@/lib/db";
import { account, zelleAccount, externalDebt, config } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateBalanceManual(accountId: number, balance: number) {
  await db.update(account).set({ balanceManual: String(balance) }).where(eq(account.id, accountId));
  revalidatePath("/");
}

export async function updateZelleBalance(id: number, balance: number) {
  await db.update(zelleAccount).set({ balanceUsd: String(balance) }).where(eq(zelleAccount.id, id));
  revalidatePath("/");
}

export async function createZelleAccount(input: { name: string; bank?: string }) {
  const [row] = await db.insert(zelleAccount).values({
    name: input.name,
    bank: input.bank ?? null,
  }).returning();
  revalidatePath("/");
  return row;
}

export async function deactivateZelleAccount(id: number) {
  await db.update(zelleAccount).set({ isActive: false }).where(eq(zelleAccount.id, id));
  revalidatePath("/");
}

export async function createExternalDebt(input: { name: string; amount: number; currency: string; direction: string }) {
  const [row] = await db.insert(externalDebt).values({
    name: input.name,
    amount: String(input.amount),
    currency: input.currency,
    direction: input.direction,
  }).returning();
  revalidatePath("/");
  revalidatePath("/deudas");
  return row;
}

export async function deactivateExternalDebt(id: number) {
  await db.update(externalDebt).set({ isActive: false }).where(eq(externalDebt.id, id));
  revalidatePath("/");
  revalidatePath("/deudas");
}

export async function updateTasaGlobalAction(rate: number) {
  await db.update(config).set({ value: { rate }, updatedAt: new Date() }).where(eq(config.key, "tasa_global"));
  revalidatePath("/");
}
