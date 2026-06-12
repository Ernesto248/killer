"use server";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { accountInputSchema, type AccountInput } from "@/lib/validators/account";

export async function createAccount(input: AccountInput) {
  const parsed = accountInputSchema.parse(input);
  const [row] = await db.insert(account).values(parsed).returning();
  revalidatePath("/config/cuentas");
  return row;
}

export async function updateAccount(id: number, input: AccountInput) {
  const parsed = accountInputSchema.parse(input);
  const [row] = await db.update(account).set(parsed).where(eq(account.id, id)).returning();
  revalidatePath("/config/cuentas");
  return row;
}

export async function deactivateAccount(id: number) {
  await db.update(account).set({ isActive: false }).where(eq(account.id, id));
  revalidatePath("/config/cuentas");
}
