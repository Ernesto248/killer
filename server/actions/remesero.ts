"use server";
import { db } from "@/lib/db";
import { cuadre, remesero, remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordUndo } from "./undo";

const schema = z.object({
  remeseroId: z.number().int(),
  date: z.date(),
  amount: z.number(),
  note: z.string().optional(),
});

export async function addRemeseroUsdMovement(input: z.infer<typeof schema>) {
  const parsed = schema.parse(input);
  await db.transaction(async (tx) => {
    await tx.insert(remeseroUsdMovement).values({
      remeseroId: parsed.remeseroId,
      date: parsed.date,
      amount: String(parsed.amount),
      note: parsed.note,
    });

    await tx.insert(remeseroBalance).values({
      remeseroId: parsed.remeseroId,
      balanceUsd: String(parsed.amount),
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: { balanceUsd: sql`${remeseroBalance.balanceUsd} + ${parsed.amount}`, updatedAt: new Date() },
    });
  });
  revalidatePath(`/remeseros/${parsed.remeseroId}`);
}

export async function createRemeseroAction(name: string) {
  const [row] = await db.insert(remesero).values({ name }).returning();
  await recordUndo({
    description: `Eliminar remesero "${row.name}"`,
    kind: "remesero.create",
    payload: { table: "remesero", action: "delete", id: row.id, after: { remesero: row, balance: null } },
    paths: ["/remeseros"],
  });
  revalidatePath("/remeseros");
  return row;
}

export async function updateRemeseroAction(id: number, name: string) {
  const [beforeRow] = await db.select().from(remesero).where(eq(remesero.id, id));
  if (!beforeRow) throw new Error("Remesero no encontrado");
  const [beforeBalance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, id));
  const [afterRow] = await db.update(remesero).set({ name }).where(eq(remesero.id, id)).returning();
  const [afterBalance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, id));
  await recordUndo({
    description: `Restaurar remesero "${beforeRow.name}"`,
    kind: "remesero.update",
    payload: {
      table: "remesero",
      action: "update",
      id,
      before: { remesero: beforeRow, balance: beforeBalance ?? null },
      after: { remesero: afterRow, balance: afterBalance ?? null },
    },
    paths: ["/remeseros", `/remeseros/${id}`],
  });
  revalidatePath("/remeseros");
}

export async function deactivateRemeseroAction(id: number) {
  const [beforeRow] = await db.select().from(remesero).where(eq(remesero.id, id));
  if (!beforeRow) throw new Error("Remesero no encontrado");
  const [beforeBalance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, id));
  const [afterRow] = await db.update(remesero).set({ isActive: false }).where(eq(remesero.id, id)).returning();
  const [afterBalance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, id));
  await recordUndo({
    description: `Reactivar remesero "${beforeRow.name}"`,
    kind: "remesero.deactivate",
    payload: {
      table: "remesero",
      action: "update",
      id,
      before: { remesero: beforeRow, balance: beforeBalance ?? null },
      after: { remesero: afterRow, balance: afterBalance ?? null },
    },
    paths: ["/remeseros", `/remeseros/${id}`],
  });
  revalidatePath("/remeseros");
}

export async function deleteRemeseroPermanentlyAction(id: number) {
  const [beforeRow] = await db.select().from(remesero).where(eq(remesero.id, id));
  if (!beforeRow) throw new Error("Remesero no encontrado");
  const [existingCuadre] = await db.select({ id: cuadre.id }).from(cuadre).where(eq(cuadre.remeseroId, id)).limit(1);
  const [existingUsdMovement] = await db.select({ id: remeseroUsdMovement.id }).from(remeseroUsdMovement).where(eq(remeseroUsdMovement.remeseroId, id)).limit(1);
  if (existingCuadre || existingUsdMovement) {
    throw new Error("No se puede eliminar permanentemente un remesero con cuadres o movimientos USD. Desactívalo para conservar el historial.");
  }

  const [beforeBalance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, id));
  await db.transaction(async (tx) => {
    await tx.delete(remeseroBalance).where(eq(remeseroBalance.remeseroId, id));
    await tx.delete(remesero).where(eq(remesero.id, id));
  });
  await recordUndo({
    description: `Restaurar remesero eliminado permanentemente "${beforeRow.name}"`,
    kind: "remesero.delete_permanent",
    payload: {
      table: "remesero",
      action: "restore",
      id,
      before: { remesero: beforeRow, balance: beforeBalance ?? null },
    },
    paths: ["/remeseros"],
  });
  revalidatePath("/remeseros");
}
