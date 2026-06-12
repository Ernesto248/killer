import { db } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { CategoryManager } from "./category-manager";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const cats = await db.select().from(category);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Categorías</h2>
      <CategoryManager categories={cats} />
    </div>
  );
}
