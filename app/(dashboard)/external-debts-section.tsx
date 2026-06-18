"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function fmt(n: number) { return n.toLocaleString("es-ES", { useGrouping: true }); }

type DebtRow = { id: number; name: string; amount: string | null; currency: string; direction: string };

export function ExternalDebtsSection({
  debts, showDebts: initialShow,
  extDebenCup, extDeboCup, extDebenUsd, extDeboUsd,
}: {
  debts: DebtRow[];
  showDebts: boolean;
  extDebenCup: number; extDeboCup: number; extDebenUsd: number; extDeboUsd: number;
}) {
  const [expanded, setExpanded] = useState(initialShow);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Deudas externas</h3>
          <span className="text-xs text-muted-foreground">({debts.length})</span>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-apple p-4 bg-green-50/40">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Me deben</div>
          <div className="text-sm font-semibold text-green-600 mt-1">+{fmt(extDebenUsd)} USD · +{fmt(extDebenCup)} CUP</div>
        </div>
        <div className="card-apple p-4 bg-red-50/40">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Debo</div>
          <div className="text-sm font-semibold text-red-600 mt-1">−{fmt(extDeboUsd)} USD · −{fmt(extDeboCup)} CUP</div>
        </div>
      </div>

      {expanded && (
        <div className="card-apple overflow-hidden mt-3">
          {debts.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">Sin deudas externas</div>}
          {debts.map((d) => (
            <div key={d.id} className="px-4 py-2.5 flex items-center justify-between border-b border-black/5 last:border-0 text-sm">
              <span className="font-medium">{d.name}</span>
              <span className={cn("tabular-nums font-semibold", d.direction === "me_deben" ? "text-green-600" : "text-red-600")}>
                {d.direction === "me_deben" ? "+" : "−"}{fmt(Number(d.amount ?? 0))} {d.currency}
              </span>
            </div>
          ))}
          <Link href="/deudas" className="block px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            Administrar deudas →
          </Link>
        </div>
      )}
    </div>
  );
}
