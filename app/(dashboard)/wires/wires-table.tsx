"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { revertWireAction } from "@/server/actions/wire";
import { cn } from "@/lib/utils";

type Row = { id: number; date: Date | null; buyerName: string | null; usd: string | null; tasa: string | null; cupTotal: string | null };

export function WiresTable({ rows, paymentMap }: { rows: Row[]; paymentMap: Map<number, number> }) {
  const router = useRouter();
  const [revertOpen, setRevertOpen] = useState<number | null>(null);
  const [pending, start] = useTransition();

  return (
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
              <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs w-12"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cupTotal = Number(r.cupTotal ?? 0);
              const pagado = paymentMap.get(r.id) ?? 0;
              const pendiente = cupTotal - pagado;
              return (
                <tr key={r.id} className="border-b border-black/5 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/wires/${r.id}`)}>
                  <td className="px-4 py-3 whitespace-nowrap">{r.date?.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) ?? "—"}</td>
                  <td className="px-4 py-3 max-w-[120px] truncate">{r.buyerName ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{Number(r.usd ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{Number(r.tasa ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{cupTotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-600">{pagado.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {pendiente > 0 ? (
                      <span className="text-red-600 font-semibold">{pendiente.toLocaleString()}</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Ok</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Dialog open={revertOpen === r.id} onOpenChange={(v) => setRevertOpen(v ? r.id : null)}>
                      <DialogTrigger
                        render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>}
                      />
                      <DialogContent>
                        <DialogHeader><DialogTitle>Revertir wire</DialogTitle></DialogHeader>
                        <p className="text-sm text-muted-foreground">¿Eliminar este wire y todos sus pagos? Esta acción no se puede deshacer.</p>
                        <DialogFooter>
                          <Button variant="outline" size="sm" onClick={() => setRevertOpen(null)}>Cancelar</Button>
                          <Button variant="destructive" size="sm" disabled={pending} onClick={() => start(async () => {
                            await revertWireAction(r.id);
                          })}>{pending ? "..." : "Revertir"}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
