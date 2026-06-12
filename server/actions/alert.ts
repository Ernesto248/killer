"use server";
import { db } from "@/lib/db";
import { alert } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function dismissAlert(id: number) {
  await db.update(alert).set({ dismissedAt: new Date() }).where(eq(alert.id, id));
  revalidatePath("/alertas");
}
