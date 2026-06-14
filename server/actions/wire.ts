"use server";
import { createWire } from "@/lib/domain/wire";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { wire, wirePayment, wireBuyerBalance, account, accountMovement } from "@/lib/db/schema";
import { eq, sql, and, or } from "drizzle-orm";

export async function createWireAction(input: Parameters<typeof createWire>[0]) {
  const result = await createWire(input);
  redirect("/wires");
  return result;
}

export async function revertWireAction(wireId: number) {
  await db.transaction(async (tx) => {
    const [w] = await tx.select().from(wire).where(eq(wire.id, wireId));
    if (!w) throw new Error("Wire no encontrado");

    await tx.delete(wirePayment).where(eq(wirePayment.wireId, wireId));
    await tx.delete(accountMovement).where(
      and(eq(accountMovement.refId, wireId), or(eq(accountMovement.refType, "wire"), eq(accountMovement.refType, "wire_payment")))
    );

    const cupTotal = Number(w.cupTotal);
    if (w.wireBuyerId) {
      const [bal] = await tx.select().from(wireBuyerBalance).where(eq(wireBuyerBalance.wireBuyerId, w.wireBuyerId));
      if (bal) {
        const newCup = Math.max(0, Number(bal.balanceCup) - cupTotal);
        await tx.update(wireBuyerBalance)
          .set({ balanceCup: String(newCup), updatedAt: new Date() })
          .where(eq(wireBuyerBalance.wireBuyerId, w.wireBuyerId));
      }
    }

    await tx.delete(wire).where(eq(wire.id, wireId));
  });
  revalidatePath("/wires");
  redirect("/wires");
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
