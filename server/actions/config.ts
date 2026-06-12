"use server";
import { db } from "@/lib/db";
import { config } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { tasaGlobalSchema } from "@/lib/validators/config";

export async function updateTasaGlobal(rate: number) {
  const parsed = tasaGlobalSchema.parse({ rate });
  await db.update(config).set({ value: parsed, updatedAt: new Date() }).where(eq(config.key, "tasa_global"));
  revalidatePath("/config");
}
