"use server";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { accountInputSchema, type AccountInput } from "@/lib/validators/account";
import { recordUndo } from "./undo";

export async function createAccount(input: AccountInput) {
  const parsed = accountInputSchema.parse(input);
  const [row] = await db.insert(account).values(parsed).returning();
  await recordUndo({
    description: `Eliminar cuenta "${row.name}"`,
    kind: "account.create",
    payload: { table: "account", action: "delete", id: row.id, after: row },
    paths: ["/config/cuentas", "/"],
  });
  revalidatePath("/config/cuentas");
  return row;
}

export async function updateAccount(id: number, input: AccountInput) {
  const parsed = accountInputSchema.parse(input);
  const [before] = await db.select().from(account).where(eq(account.id, id));
  if (!before) throw new Error("Cuenta no encontrada");
  const [row] = await db.update(account).set(parsed).where(eq(account.id, id)).returning();
  await recordUndo({
    description: `Restaurar cuenta "${before.name}" a su valor anterior`,
    kind: "account.update",
    payload: { table: "account", action: "update", id, before, after: row },
    paths: ["/config/cuentas", "/"],
  });
  revalidatePath("/config/cuentas");
  return row;
}

export async function deactivateAccount(id: number) {
  const [before] = await db.select().from(account).where(eq(account.id, id));
  const [after] = await db.update(account).set({ isActive: false }).where(eq(account.id, id)).returning();
  if (before) {
    await recordUndo({
      description: `Reactivar cuenta "${before.name}"`,
      kind: "account.deactivate",
      payload: { table: "account", action: "update", id, before, after },
      paths: ["/config/cuentas", "/"],
    });
  }
  revalidatePath("/config/cuentas");
}
