import { db } from "@/lib/db";
import { operationalExpense, category } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function GastosPage() {
  const rows = await db
    .select({ id: operationalExpense.id, date: operationalExpense.date, description: operationalExpense.description, cup: operationalExpense.cupAmount, usd: operationalExpense.usdAmount, categoryName: category.name })
    .from(operationalExpense)
    .leftJoin(category, eq(category.id, operationalExpense.categoryId))
    .orderBy(desc(operationalExpense.date))
    .limit(100);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Gastos</h2>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2">Categoría</th><th className="p-2">Descripción</th><th className="p-2 text-right">CUP</th><th className="p-2 text-right">USD</th></tr></thead>
        <tbody>{rows.map((r) => (<tr key={r.id} className="border-b"><td className="p-2">{r.date?.toLocaleDateString()}</td><td className="p-2">{r.categoryName}</td><td className="p-2">{r.description}</td><td className="p-2 text-right tabular-nums">{Number(r.cup).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(r.usd).toLocaleString()}</td></tr>))}</tbody>
      </table></div>
    </div>
  );
}
