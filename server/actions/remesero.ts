"use server";
import { db } from "@/lib/db";
import { remesero, remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  revalidatePath("/remeseros");
  return row;
}

export async function updateRemeseroAction(id: number, name: string) {
  await db.update(remesero).set({ name }).where(eq(remesero.id, id));
  revalidatePath("/remeseros");
}

export async function deactivateRemeseroAction(id: number) {
  await db.update(remesero).set({ isActive: false }).where(eq(remesero.id, id));
  revalidatePath("/remeseros");
}
