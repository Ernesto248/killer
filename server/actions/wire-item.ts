"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { wireItem } from "@/lib/db/schema";
import { recordUndo } from "./undo";

type WireItemInput = {
  name: string;
  amount: number;
  currency: string;
  direction: string;
  notes?: string;
};

const paths = ["/", "/wires"];

export async function createWireItem(input: WireItemInput) {
  const [row] = await db.insert(wireItem).values({
    name: input.name,
    amount: String(input.amount),
    currency: input.currency,
    direction: input.direction,
    notes: input.notes ?? null,
  }).returning();

  await recordUndo({
    description: `Eliminar wire "${row.name}" por ${Number(row.amount).toLocaleString("es-ES")} ${row.currency}`,
    kind: "wire_item.create",
    payload: { table: "wireItem", action: "delete", id: row.id, after: row },
    paths,
  });

  for (const path of paths) revalidatePath(path);
  return row;
}

export async function updateWireItem(id: number, input: Partial<WireItemInput>) {
  const [before] = await db.select().from(wireItem).where(eq(wireItem.id, id));
  if (!before) throw new Error("Wire no encontrado");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.amount !== undefined) data.amount = String(input.amount);
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.direction !== undefined) data.direction = input.direction;
  if (input.notes !== undefined) data.notes = input.notes || null;

  const [after] = await db.update(wireItem).set(data).where(eq(wireItem.id, id)).returning();
  await recordUndo({
    description: `Restaurar wire "${before.name}" a su valor anterior`,
    kind: "wire_item.update",
    payload: { table: "wireItem", action: "update", id, before, after },
    paths,
  });

  for (const path of paths) revalidatePath(path);
}

export async function deactivateWireItem(id: number) {
  const [before] = await db.select().from(wireItem).where(eq(wireItem.id, id));
  if (!before) throw new Error("Wire no encontrado");

  const [after] = await db.update(wireItem).set({ isActive: false }).where(eq(wireItem.id, id)).returning();
  await recordUndo({
    description: `Reactivar wire "${before.name}"`,
    kind: "wire_item.deactivate",
    payload: { table: "wireItem", action: "update", id, before, after },
    paths,
  });

  for (const path of paths) revalidatePath(path);
}
