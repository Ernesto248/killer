"use server";
import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { cuadre, cuadreTirada, remesero, remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
import { recordUndo } from "./undo";

const usdMovementSchema = z.object({
  remeseroId: z.number().int(),
  date: z.date(),
  amount: z.number(),
  note: z.string().optional(),
});

export async function addRemeseroUsdMovement(input: z.infer<typeof usdMovementSchema>) {
  const parsed = usdMovementSchema.parse(input);
  await db.transaction(async (tx) => {
    await tx.insert(remeseroUsdMovement).values({
      remeseroId: parsed.remeseroId,
      date: parsed.date,
      amount: String(parsed.amount),
      note: parsed.note ?? null,
    });
    await recalcRemeseroBalance(tx, parsed.remeseroId);
  });
  revalidatePath(`/remeseros/${parsed.remeseroId}`);
}

export async function updateRemeseroUsdMovementAction(input: { id: number; date: Date; amount: number; note?: string }) {
  await db.transaction(async (tx) => {
    const [movement] = await tx.select().from(remeseroUsdMovement).where(eq(remeseroUsdMovement.id, input.id));
    if (!movement) throw new Error("Movimiento USD no encontrado");

    await tx.update(remeseroUsdMovement).set({
      date: input.date,
      amount: String(input.amount),
      note: input.note ?? null,
    }).where(eq(remeseroUsdMovement.id, input.id));

    await recalcRemeseroBalance(tx, movement.remeseroId);
    revalidatePath(`/remeseros/${movement.remeseroId}`);
  });
}

export async function deleteRemeseroUsdMovementAction(id: number) {
  await db.transaction(async (tx) => {
    const [movement] = await tx.select().from(remeseroUsdMovement).where(eq(remeseroUsdMovement.id, id));
    if (!movement) throw new Error("Movimiento USD no encontrado");

    await tx.delete(remeseroUsdMovement).where(eq(remeseroUsdMovement.id, id));
    await recalcRemeseroBalance(tx, movement.remeseroId);
    revalidatePath(`/remeseros/${movement.remeseroId}`);
  });
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
  const [existingRemesero] = await db.select().from(remesero).where(eq(remesero.id, id));
  if (!existingRemesero) throw new Error("Remesero no encontrado");

  await db.transaction(async (tx) => {
    const cuadreRows = await tx.select({ id: cuadre.id }).from(cuadre).where(eq(cuadre.remeseroId, id));

    for (const row of cuadreRows) {
      await tx.delete(cuadreTirada).where(eq(cuadreTirada.cuadreId, row.id));
    }

    await tx.delete(cuadre).where(eq(cuadre.remeseroId, id));
    await tx.delete(remeseroUsdMovement).where(eq(remeseroUsdMovement.remeseroId, id));
    await tx.delete(remeseroBalance).where(eq(remeseroBalance.remeseroId, id));
    await tx.delete(remesero).where(eq(remesero.id, id));
  });

  revalidatePath("/remeseros");
}

async function recalcRemeseroBalance(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  remeseroId: number,
) {
  const [latestCuadre] = await tx.select().from(cuadre)
    .where(eq(cuadre.remeseroId, remeseroId))
    .orderBy(desc(cuadre.date), desc(cuadre.id))
    .limit(1);

  const [usdSummary] = await tx.select({
    total: sql<string>`COALESCE(SUM(${remeseroUsdMovement.amount}), 0)`,
  }).from(remeseroUsdMovement).where(eq(remeseroUsdMovement.remeseroId, remeseroId));

  const balanceCup = latestCuadre?.balanceFinalCup ?? "0";
  const balanceUsd = usdSummary?.total ?? "0";
  const lastCuadreAt = latestCuadre?.date ?? null;

  if (Number(balanceCup) === 0 && Number(balanceUsd) === 0 && lastCuadreAt === null) {
    await tx.delete(remeseroBalance).where(eq(remeseroBalance.remeseroId, remeseroId));
    return;
  }

  await tx.insert(remeseroBalance).values({
    remeseroId,
    balanceCup,
    balanceUsd,
    lastCuadreAt,
  }).onConflictDoUpdate({
    target: remeseroBalance.remeseroId,
    set: {
      balanceCup,
      balanceUsd,
      lastCuadreAt,
      updatedAt: new Date(),
    },
  });
}
