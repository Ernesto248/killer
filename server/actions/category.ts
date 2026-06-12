"use server";
import { db } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { categoryInputSchema } from "@/lib/validators/category";

export async function createCategory(input: { name: string }) {
  const parsed = categoryInputSchema.parse(input);
  const [row] = await db.insert(category).values(parsed).returning();
  revalidatePath("/config/categorias");
  return row;
}

export async function deactivateCategory(id: number) {
  await db.update(category).set({ isActive: false }).where(eq(category.id, id));
  revalidatePath("/config/categorias");
}
