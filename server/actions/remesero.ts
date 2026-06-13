"use server";
import { db } from "@/lib/db";
import { remeseroBalance, remeseroUsdMovement, account, accountMovement } from "@/lib/db/schema";
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
    const [mov] = await tx.insert(remeseroUsdMovement).values({
      remeseroId: parsed.remeseroId,
      date: parsed.date,
      amount: String(parsed.amount),
      note: parsed.note,
    }).returning({ id: remeseroUsdMovement.id });

    await tx.insert(remeseroBalance).values({
      remeseroId: parsed.remeseroId,
      balanceUsd: String(parsed.amount),
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: { balanceUsd: sql`${remeseroBalance.balanceUsd} + ${parsed.amount}`, updatedAt: new Date() },
    });

    const [usdAcc] = await tx.select().from(account).where(eq(account.type, "efectivo_usd"));
    if (usdAcc) {
      await tx.insert(accountMovement).values({
        accountId: usdAcc.id,
        date: parsed.date,
        amount: String(-parsed.amount),
        currency: "USD",
        refType: "remesero_usd",
        refId: mov.id,
        note: parsed.note ?? `Movimiento USD remesero #${parsed.remeseroId}`,
      });
    }
  });
  revalidatePath(`/remeseros/${parsed.remeseroId}`);
}
