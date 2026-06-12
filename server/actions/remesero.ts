"use server";
import { db } from "@/lib/db";
import { remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
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
