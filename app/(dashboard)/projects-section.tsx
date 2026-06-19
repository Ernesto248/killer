"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function fmt(n: number) { return n.toLocaleString("es-ES", { useGrouping: true }); }

type ProjectRow = { id: number; name: string; amount: string | null; currency: string; direction: string; notes: string | null };

export function ProjectsSection({ projects, proyDebenCup, proyDeboCup, proyDebenUsd, proyDeboUsd }: {
  projects: ProjectRow[];
  proyDebenCup: number; proyDeboCup: number; proyDebenUsd: number; proyDeboUsd: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Proyectos</h3>
          <span className="text-xs text-muted-foreground">({projects.length})</span>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-apple p-4 bg-green-50/40">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Me deben</div>
          <div className="text-sm font-semibold text-green-600 mt-1">+{fmt(proyDebenUsd)} USD · +{fmt(proyDebenCup)} CUP</div>
        </div>
        <div className="card-apple p-4 bg-red-50/40">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Debo</div>
          <div className="text-sm font-semibold text-red-600 mt-1">−{fmt(proyDeboUsd)} USD · −{fmt(proyDeboCup)} CUP</div>
        </div>
      </div>

      {expanded && (
        <div className="card-apple overflow-hidden mt-3">
          {projects.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">Sin proyectos</div>}
          {projects.map((p) => (
            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between border-b border-black/5 last:border-0 text-sm">
              <div>
                <span className="font-medium">{p.name}</span>
                {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
              </div>
              <span className={cn("tabular-nums font-semibold", p.direction === "me_deben" ? "text-green-600" : "text-red-600")}>
                {p.direction === "me_deben" ? "+" : "−"}{fmt(Number(p.amount ?? 0))} {p.currency}
              </span>
            </div>
          ))}
          <Link href="/proyectos" className="block px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            Administrar proyectos →
          </Link>
        </div>
      )}
    </div>
  );
}
