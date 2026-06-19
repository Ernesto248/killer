"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { deleteSnapshotAction } from "@/server/actions/snapshot";
import { cn } from "@/lib/utils";

type Snapshot = {
  id: number;
  cupFisico: string; usdFisico: string; tasaGlobal: string;
  remeserosCup: string; remeserosUsd: string;
  wiresCup: string; wiresUsd: string; zelleTotal: string;
  extDebenCup: string; extDeboCup: string; extDebenUsd: string; extDeboUsd: string;
  proyDebenCup: string; proyDeboCup: string; proyDebenUsd: string; proyDeboUsd: string;
  ganancia: string; createdAt: Date;
};

function fmt(n: number) { return n.toLocaleString("es-ES", { useGrouping: true }); }
function v(s: string) { return Number(s ?? 0); }

const cardDefs = [
  { key: "cupFisico" as const, label: "CUP Físico", suffix: "CUP" },
  { key: "usdFisico" as const, label: "USD Físico", suffix: "USD" },
  { key: "tasaGlobal" as const, label: "Tasa Global", suffix: "" },
  { key: "remeserosCup" as const, label: "Remeseros CUP", suffix: "CUP" },
  { key: "remeserosUsd" as const, label: "Remeseros USD", suffix: "USD" },
  { key: "wiresCup" as const, label: "Wires CUP", suffix: "CUP" },
  { key: "wiresUsd" as const, label: "Wires USD", suffix: "USD" },
  { key: "zelleTotal" as const, label: "Zelle", suffix: "USD" },
];

const extKeys = [
  { key: "extDebenCup" as const, label: "Me deben CUP" },
  { key: "extDeboCup" as const, label: "Debo CUP" },
  { key: "extDebenUsd" as const, label: "Me deben USD" },
  { key: "extDeboUsd" as const, label: "Debo USD" },
];

const proyKeys = [
  { key: "proyDebenCup" as const, label: "Me deben CUP" },
  { key: "proyDeboCup" as const, label: "Debo CUP" },
  { key: "proyDebenUsd" as const, label: "Me deben USD" },
  { key: "proyDeboUsd" as const, label: "Debo USD" },
];

export function HistorialClient({ snapshots }: { snapshots: Snapshot[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  if (snapshots.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No hay snapshots guardados. Volvé al inicio y presioná "Guardar snapshot".</div>;
  }

  return (
    <div className="space-y-3">
      {snapshots.map((s) => {
        const open = expanded.has(s.id);
        const g = v(s.ganancia);
        return (
          <div key={s.id} className="card-apple overflow-hidden">
            <button onClick={() => toggle(s.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors text-left">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">
                  {s.createdAt.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                  {" "}
                  {s.createdAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={cn("tabular-nums font-bold text-sm", g >= 0 ? "text-green-600" : "text-red-600")}>
                  {g >= 0 ? "+" : ""}${fmt(g)} USD
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                  onClick={(e) => { e.stopPropagation(); start(() => deleteSnapshotAction(s.id)); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {open && (
              <div className="px-4 pb-4 space-y-3 border-t border-black/5 pt-3">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {cardDefs.map((c) => {
                    const val = v((s as any)[c.key]);
                    return (
                      <div key={c.key} className="rounded-lg bg-muted/30 p-2.5">
                        <div className="text-xs text-muted-foreground">{c.label}</div>
                        <div className={cn("text-sm font-semibold tabular-nums", val >= 0 ? "text-green-600" : "text-red-600")}>
                          {c.key === "tasaGlobal" ? fmt(val) : (val >= 0 ? "+" : "") + fmt(val)} {c.suffix}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-muted-foreground">Deudas externas</div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {extKeys.map((c) => {
                    const val = v((s as any)[c.key]);
                    const isDeben = c.key.includes("Deben");
                    return (
                      <div key={c.key} className="rounded-lg bg-muted/30 p-2.5">
                        <div className="text-xs text-muted-foreground">{c.label}</div>
                        <div className={cn("text-sm font-semibold tabular-nums", isDeben ? "text-green-600" : "text-red-600")}>
                          {isDeben ? "+" : "−"}{fmt(val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs font-medium text-muted-foreground">Proyectos</div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {proyKeys.map((c) => {
                    const val = v((s as any)[c.key]);
                    const isDeben = c.key.includes("Deben");
                    return (
                      <div key={c.key} className="rounded-lg bg-muted/30 p-2.5">
                        <div className="text-xs text-muted-foreground">{c.label}</div>
                        <div className={cn("text-sm font-semibold tabular-nums", isDeben ? "text-green-600" : "text-red-600")}>
                          {isDeben ? "+" : "−"}{fmt(val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
