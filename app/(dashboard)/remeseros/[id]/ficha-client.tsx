"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  remesero: { id: number; name: string };
  balance: { balanceCup: string | null; balanceUsd: string | null; lastCuadreAt: Date | null } | null;
  cuadres: Array<{ id: number; date: Date; balanceInicialCup: string; pagadoCup: string; balanceFinalCup: string; balanceFinalLabel: string; tiradoItems: unknown }>;
  usdMovs: Array<{ id: number; date: Date; amount: string; note: string | null }>;
};

const COLLAPSED_COUNT = 3;

export function FichaClient({ remesero, balance, cuadres, usdMovs }: Props) {
  const [cuadresExpanded, setCuadresExpanded] = useState(false);
  const [usdExpanded, setUsdExpanded] = useState(false);

  const cup = Number(balance?.balanceCup ?? 0);
  const usd = Number(balance?.balanceUsd ?? 0);
  const lastLabel = cuadres.length > 0 ? cuadres[0].balanceFinalLabel : null;
  const isDeuda = lastLabel === "deuda";
  const isFondo = lastLabel === "fondo";

  const visibleCuadres = cuadresExpanded ? cuadres : cuadres.slice(0, COLLAPSED_COUNT);
  const visibleUsd = usdExpanded ? usdMovs : usdMovs.slice(0, COLLAPSED_COUNT);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/remeseros" className="p-1.5 rounded-lg hover:bg-accent transition-colors -ml-1.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-semibold">{remesero.name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={cn("card-apple p-4", isDeuda ? "bg-red-50/60" : isFondo ? "bg-green-50/60" : "")}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Balance CUP</div>
          <div className={cn("text-2xl tabular-nums font-semibold mt-1", isDeuda ? "text-red-600" : isFondo ? "text-green-600" : cup > 0 ? "text-red-600" : cup < 0 ? "text-green-600" : "text-foreground")}>
            {cup.toLocaleString()}
          </div>
          {lastLabel && (
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1", isDeuda ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
              {lastLabel}
            </span>
          )}
        </div>
        <div className={cn("card-apple p-4", usd > 0 ? "bg-red-50/60" : usd < 0 ? "bg-green-50/60" : "")}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Balance USD</div>
          <div className={cn("text-2xl tabular-nums font-semibold mt-1", usd > 0 ? "text-red-600" : usd < 0 ? "text-green-600" : "text-foreground")}>
            {usd.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/nuevo?tab=cuadre&remesero=${encodeURIComponent(remesero.name)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <FileText className="h-4 w-4" />
          Nuevo cuadre
        </Link>
        <Link
          href={`/nuevo?tab=usd&remesero=${encodeURIComponent(remesero.name)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <DollarSign className="h-4 w-4" />
          Nuevo USD
        </Link>
      </div>

      <section>
        <button
          onClick={() => setCuadresExpanded(!cuadresExpanded)}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Historial de cuadres ({cuadres.length})
          </h3>
          {cuadres.length > COLLAPSED_COUNT && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {cuadresExpanded ? "Contraer" : "Ver todos"}
              {cuadresExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          )}
        </button>
        {visibleCuadres.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Sin cuadres registrados.</p>
        ) : (
          <div className="card-apple overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Inicial</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Pagado</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Final</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCuadres.map((c) => {
                    const d = c.balanceFinalLabel === "deuda";
                    const f = c.balanceFinalLabel === "fondo";
                    return (
                      <tr key={c.id} className="border-b border-black/5 hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">{c.date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{Number(c.balanceInicialCup).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{Number(c.pagadoCup).toLocaleString()}</td>
                        <td className={cn("px-4 py-2.5 text-right tabular-nums font-semibold", d ? "text-red-600" : f ? "text-green-600" : "")}>
                          {Number(c.balanceFinalCup).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5">
                          {d && <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Deuda</span>}
                          {f && <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Fondo</span>}
                          {!d && !f && "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <button
          onClick={() => setUsdExpanded(!usdExpanded)}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Movimientos USD ({usdMovs.length})
          </h3>
          {usdMovs.length > COLLAPSED_COUNT && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {usdExpanded ? "Contraer" : "Ver todos"}
              {usdExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </span>
          )}
        </button>
        {visibleUsd.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Sin movimientos USD registrados.</p>
        ) : (
          <div className="card-apple overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Fecha</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Monto</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsd.map((m) => {
                    const amt = Number(m.amount);
                    return (
                      <tr key={m.id} className="border-b border-black/5 hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">{m.date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
                        <td className={cn("px-4 py-2.5 text-right tabular-nums font-semibold", amt > 0 ? "text-red-600" : amt < 0 ? "text-green-600" : "")}>
                          {amt.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground max-w-[180px] truncate">{m.note ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
