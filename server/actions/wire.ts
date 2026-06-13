"use server";
import { createWire } from "@/lib/domain/wire";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { wirePayment, wireBuyerBalance, account, accountMovement } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function createWireAction(input: Parameters<typeof createWire>[0]) {
  const result = await createWire(input);
  revalidatePath("/wires");
  revalidatePath("/wire-buyers");
  return result;
}

export async function addWirePaymentAction(input: { wireId: number; wireBuyerId: number; date: Date; cupAmount: number; note?: string }) {
  await db.transaction(async (tx) => {
    await tx.insert(wirePayment).values({
      wireId: input.wireId,
      wireBuyerId: input.wireBuyerId,
      date: input.date,
      cupAmount: String(input.cupAmount),
      note: input.note,
    });
    await tx.update(wireBuyerBalance)
      .set({ balanceCup: sql`${wireBuyerBalance.balanceCup} - ${input.cupAmount}`, updatedAt: new Date() })
      .where(eq(wireBuyerBalance.wireBuyerId, input.wireBuyerId));
    const [cupAccount] = await tx.select().from(account).where(eq(account.type, "efectivo_cup"));
    if (cupAccount) {
      await tx.insert(accountMovement).values({
        accountId: cupAccount.id,
        date: input.date,
        amount: String(input.cupAmount),
        currency: "CUP",
        refType: "wire_payment",
        refId: input.wireId,
      });
    }
  });
  revalidatePath(`/wires/${input.wireId}`);
  revalidatePath(`/wire-buyers/${input.wireBuyerId}`);
}

export async function createZelleAccount(name: string) {
  const [row] = await db.insert(account).values({
    name,
    type: "llc_usa",
    currency: "USD",
  }).returning();
  revalidatePath("/wires/nuevo");
  return row;
}
