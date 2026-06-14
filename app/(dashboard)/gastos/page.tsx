import { db } from "@/lib/db";
import { operationalExpense, category } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GastosPage() {
  const rows = await db
    .select({ id: operationalExpense.id, date: operationalExpense.date, description: operationalExpense.description, cup: operationalExpense.cupAmount, usd: operationalExpense.usdAmount, categoryName: category.name })
    .from(operationalExpense)
    .leftJoin(category, eq(category.id, operationalExpense.categoryId))
    .orderBy(desc(operationalExpense.date))
    .limit(100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/gastos/nuevo" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
          <Plus className="h-4 w-4" /> Nuevo gasto
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay gastos registrados</div>
      ) : (
        <div className="card-apple overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Categoría</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">CUP</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">USD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{r.date?.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{r.categoryName}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">{r.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-600">{Number(r.cup).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-blue-600">{Number(r.usd).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
