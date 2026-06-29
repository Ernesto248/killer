"use server";
import { db } from "@/lib/db";
import { account, zelleAccount, externalDebt, project, config } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { recordUndo } from "./undo";

export async function updateBalanceManual(accountId: number, balance: number) {
  const [before] = await db.select().from(account).where(eq(account.id, accountId));
  const [after] = await db.update(account).set({ balanceManual: String(balance) }).where(eq(account.id, accountId)).returning();
  if (before) {
    await recordUndo({
      description: `Restaurar balance de "${before.name}" a ${Number(before.balanceManual).toLocaleString("es-ES")} ${before.currency}`,
      kind: "account.balance.update",
      payload: { table: "account", action: "update", id: accountId, before, after },
      paths: ["/"],
    });
  }
  revalidatePath("/");
}

export async function updateZelleBalance(id: number, balance: number) {
  const [before] = await db.select().from(zelleAccount).where(eq(zelleAccount.id, id));
  const [after] = await db.update(zelleAccount).set({ balanceUsd: String(balance) }).where(eq(zelleAccount.id, id)).returning();
  if (before) {
    await recordUndo({
      description: `Restaurar Zelle "${before.name}" a ${Number(before.balanceUsd).toLocaleString("es-ES")} USD`,
      kind: "zelle.update_balance",
      payload: { table: "zelleAccount", action: "update", id, before, after },
      paths: ["/", "/zelle"],
    });
  }
  revalidatePath("/");
}

export async function createZelleAccount(input: { name: string; bank?: string }) {
  const [row] = await db.insert(zelleAccount).values({
    name: input.name,
    bank: input.bank ?? null,
  }).returning();
  await recordUndo({
    description: `Eliminar cuenta Zelle "${row.name}"`,
    kind: "zelle.create",
    payload: { table: "zelleAccount", action: "delete", id: row.id, after: row },
    paths: ["/", "/zelle"],
  });
  revalidatePath("/");
  return row;
}

export async function deactivateZelleAccount(id: number) {
  const [before] = await db.select().from(zelleAccount).where(eq(zelleAccount.id, id));
  const [after] = await db.update(zelleAccount).set({ isActive: false }).where(eq(zelleAccount.id, id)).returning();
  if (before) {
    await recordUndo({
      description: `Reactivar cuenta Zelle "${before.name}"`,
      kind: "zelle.deactivate",
      payload: { table: "zelleAccount", action: "update", id, before, after },
      paths: ["/", "/zelle"],
    });
  }
  revalidatePath("/");
}

export async function createExternalDebt(input: { name: string; amount: number; currency: string; direction: string; notes?: string }) {
  const [row] = await db.insert(externalDebt).values({
    name: input.name,
    amount: String(input.amount),
    currency: input.currency,
    direction: input.direction,
    notes: input.notes ?? null,
  }).returning();
  await recordUndo({
    description: `Eliminar deuda "${row.name}" por ${Number(row.amount).toLocaleString("es-ES")} ${row.currency}`,
    kind: "external_debt.create",
    payload: { table: "externalDebt", action: "delete", id: row.id, after: row },
    paths: ["/", "/deudas"],
  });
  revalidatePath("/");
  revalidatePath("/deudas");
  return row;
}

export async function updateExternalDebt(id: number, input: { name?: string; amount?: number; currency?: string; direction?: string; notes?: string }) {
  const [before] = await db.select().from(externalDebt).where(eq(externalDebt.id, id));
  if (!before) throw new Error("Deuda no encontrada");
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.amount !== undefined) data.amount = String(input.amount);
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.direction !== undefined) data.direction = input.direction;
    if (input.notes !== undefined) data.notes = input.notes || null;
  const [after] = await db.update(externalDebt).set(data).where(eq(externalDebt.id, id)).returning();
  await recordUndo({
    description: `Restaurar deuda "${before.name}" a su valor anterior`,
    kind: "external_debt.update",
    payload: { table: "externalDebt", action: "update", id, before, after },
    paths: ["/", "/deudas"],
  });
  revalidatePath("/");
  revalidatePath("/deudas");
}

export async function deactivateExternalDebt(id: number) {
  const [before] = await db.select().from(externalDebt).where(eq(externalDebt.id, id));
  const [after] = await db.update(externalDebt).set({ isActive: false }).where(eq(externalDebt.id, id)).returning();
  if (before) {
    await recordUndo({
      description: `Reactivar deuda "${before.name}"`,
      kind: "external_debt.deactivate",
      payload: { table: "externalDebt", action: "update", id, before, after },
      paths: ["/", "/deudas"],
    });
  }
  revalidatePath("/");
  revalidatePath("/deudas");
}

export async function updateTasaGlobalAction(rate: number) {
  await db.update(config).set({ value: { rate }, updatedAt: new Date() }).where(eq(config.key, "tasa_global"));
  revalidatePath("/");
}

export async function createProject(input: { name: string; amount: number; currency: string; direction: string; notes?: string }) {
  const [row] = await db.insert(project).values({
    name: input.name, amount: String(input.amount), currency: input.currency,
    direction: input.direction, notes: input.notes ?? null,
  }).returning();
  await recordUndo({
    description: `Eliminar proyecto "${row.name}" por ${Number(row.amount).toLocaleString("es-ES")} ${row.currency}`,
    kind: "project.create",
    payload: { table: "project", action: "delete", id: row.id, after: row },
    paths: ["/", "/proyectos"],
  });
  revalidatePath("/"); revalidatePath("/proyectos");
  return row;
}

export async function updateProject(id: number, input: { name?: string; amount?: number; currency?: string; direction?: string; notes?: string }) {
  const [before] = await db.select().from(project).where(eq(project.id, id));
  if (!before) throw new Error("Proyecto no encontrado");
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.amount !== undefined) data.amount = String(input.amount);
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.direction !== undefined) data.direction = input.direction;
  if (input.notes !== undefined) data.notes = input.notes || null;
  const [after] = await db.update(project).set(data).where(eq(project.id, id)).returning();
  await recordUndo({
    description: `Restaurar proyecto "${before.name}" a su valor anterior`,
    kind: "project.update",
    payload: { table: "project", action: "update", id, before, after },
    paths: ["/", "/proyectos"],
  });
  revalidatePath("/"); revalidatePath("/proyectos");
}

export async function deactivateProject(id: number) {
  const [before] = await db.select().from(project).where(eq(project.id, id));
  const [after] = await db.update(project).set({ isActive: false }).where(eq(project.id, id)).returning();
  if (before) {
    await recordUndo({
      description: `Reactivar proyecto "${before.name}"`,
      kind: "project.deactivate",
      payload: { table: "project", action: "update", id, before, after },
      paths: ["/", "/proyectos"],
    });
  }
  revalidatePath("/"); revalidatePath("/proyectos");
}
