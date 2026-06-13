import { db } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { CategoryManager } from "./category-manager";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const cats = await db.select().from(category);
  return (
    <div className="space-y-4">
      <CategoryManager categories={cats} />
    </div>
  );
}
