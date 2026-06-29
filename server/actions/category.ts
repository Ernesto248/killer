"use server";
import { db } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { categoryInputSchema } from "@/lib/validators/category";
import { recordUndo } from "./undo";

export async function createCategory(input: { name: string }) {
  const parsed = categoryInputSchema.parse(input);
  const [row] = await db.insert(category).values(parsed).returning();
  await recordUndo({
    description: `Eliminar categoria "${row.name}"`,
    kind: "category.create",
    payload: { table: "category", action: "delete", id: row.id, after: row },
    paths: ["/config/categorias"],
  });
  revalidatePath("/config/categorias");
  return row;
}

export async function deactivateCategory(id: number) {
  const [before] = await db.select().from(category).where(eq(category.id, id));
  const [after] = await db.update(category).set({ isActive: false }).where(eq(category.id, id)).returning();
  if (before) {
    await recordUndo({
      description: `Reactivar categoria "${before.name}"`,
      kind: "category.deactivate",
      payload: { table: "category", action: "update", id, before, after },
      paths: ["/config/categorias"],
    });
  }
  revalidatePath("/config/categorias");
}
