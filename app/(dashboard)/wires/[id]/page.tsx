import { db } from "@/lib/db";
import { wire, wirePayment, wireBuyer, account } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PaymentForm } from "./payment-form";
import { cn } from "@/lib/utils";

export default async function WireFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wireId = Number(id);
  const [w] = await db.select().from(wire).where(eq(wire.id, wireId));
  if (!w) notFound();

  const [wb] = await db.select().from(wireBuyer).where(eq(wireBuyer.id, w.wireBuyerId));
  const payments = await db.select().from(wirePayment).where(eq(wirePayment.wireId, wireId)).orderBy(desc(wirePayment.date));

  const totalPagado = payments.reduce((a, p) => a + Number(p.cupAmount), 0);
  const cupTotal = Number(w.cupTotal);
  const pendiente = cupTotal - totalPagado;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/wires" className="p-1.5 rounded-lg hover:bg-accent transition-colors -ml-1.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-semibold">Wire #{w.id} — {wb?.name ?? "—"}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">USD</div>
          <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{Number(w.usdAmount).toLocaleString()}</div>
        </div>
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Tasa</div>
          <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{Number(w.tasaCup).toLocaleString()}</div>
        </div>
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">CUP Total</div>
          <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{cupTotal.toLocaleString()}</div>
        </div>
        <div className={cn("card-apple p-4", pendiente > 0 ? "bg-red-50/40" : "bg-green-50/40")}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Pendiente</div>
          <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1", pendiente > 0 ? "text-red-600" : "text-green-600")}>
            {pendiente.toLocaleString()}
          </div>
          {pendiente === 0 && <span className="text-xs text-green-700 font-medium">Completado</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Comprador</div>
          <div className="text-lg font-semibold mt-1">{wb?.name ?? "—"}</div>
        </div>
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Pagado</div>
          <div className="text-lg font-semibold mt-1 text-green-600 tabular-nums">{totalPagado.toLocaleString()} CUP</div>
        </div>
      </div>

      <PaymentForm wireId={w.id} wireBuyerId={w.wireBuyerId} />

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Pagos ({payments.length})</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Sin pagos registrados</div>
        ) : (
          <div className="card-apple overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">CUP</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-black/5 hover:bg-accent/40">
                      <td className="px-4 py-2.5 whitespace-nowrap">{p.date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-green-600">{Number(p.cupAmount).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-muted-foreground max-w-[160px] truncate">{p.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
