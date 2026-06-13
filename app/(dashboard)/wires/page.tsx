import { db } from "@/lib/db";
import { wire, wireBuyer, wirePayment } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WiresPage() {
  const [rows, paymentSums] = await Promise.all([
    db
      .select({
        id: wire.id,
        date: wire.date,
        buyerName: wireBuyer.name,
        usd: wire.usdAmount,
        tasa: wire.tasaCup,
        cupTotal: wire.cupTotal,
      })
      .from(wire)
      .leftJoin(wireBuyer, eq(wireBuyer.id, wire.wireBuyerId))
      .orderBy(desc(wire.date)),
    db
      .select({
        wireId: wirePayment.wireId,
        total: sql<number>`COALESCE(sum(cup_amount::numeric), 0)`,
      })
      .from(wirePayment)
      .groupBy(wirePayment.wireId),
  ]);

  const paymentMap = new Map(paymentSums.map((p) => [p.wireId, Number(p.total ?? 0)]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Wires</h2>
        <Link href="/wires/nuevo" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
          <Plus className="h-4 w-4" /> Nuevo wire
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay wires registrados</div>
      ) : (
        <div className="card-apple overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Buyer</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">USD</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">Tasa</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">CUP Total</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">Pagado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const cupTotal = Number(r.cupTotal ?? 0);
                  const pagado = paymentMap.get(r.id) ?? 0;
                  const pendiente = cupTotal - pagado;
                  return (
                    <tr key={r.id} className="border-b border-black/5 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/wires/${r.id}`} className="hover:underline font-medium">
                          {r.date?.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[120px] truncate">{r.buyerName ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(r.usd ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(r.tasa ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{cupTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-600">{pagado.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {pendiente > 0 ? (
                          <span className="text-red-600 font-semibold">{pendiente.toLocaleString()}</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Completado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
