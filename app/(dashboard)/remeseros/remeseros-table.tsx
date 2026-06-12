"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type RemeseroRow = {
  id: number;
  name: string;
  balanceCup: string | null;
  balanceUsd: string | null;
  lastCuadreAt: Date | null;
};

type SortKey = "name" | "balanceCup" | "balanceUsd" | "lastCuadreAt";
type SortDir = "asc" | "desc";

export function RemeserosTable({ rows }: { rows: RemeseroRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastCuadreAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ current }: { current: SortKey }) => {
    if (sortKey !== current) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = rows.filter((r) => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortKey === "name") return dir * (a.name.localeCompare(b.name));
      if (sortKey === "lastCuadreAt") {
        const da = a.lastCuadreAt?.getTime() ?? 0;
        const db = b.lastCuadreAt?.getTime() ?? 0;
        return dir * (da - db);
      }
      const va = Number((a as any)[sortKey] ?? 0);
      const vb = Number((b as any)[sortKey] ?? 0);
      return dir * (va - vb);
    });
    return result;
  }, [rows, search, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar remesero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
            <X className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? "No se encontraron remeseros" : "No hay remeseros registrados"}
        </div>
      ) : (
        <div className="card-apple overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-muted/40">
                  {([
                    { key: "name" as const, label: "Nombre", align: "left" },
                    { key: "balanceCup" as const, label: "Balance CUP", align: "right" },
                    { key: "balanceUsd" as const, label: "Balance USD", align: "right" },
                    { key: "lastCuadreAt" as const, label: "Último cuadre", align: "left" },
                  ]).map((col) => (
                    <th key={col.key} className={cn("px-4 py-3 font-medium text-muted-foreground", col.align === "right" ? "text-right" : "text-left")}>
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={cn("inline-flex items-center gap-1 hover:text-foreground transition-colors", sortKey === col.key && "text-foreground font-semibold")}
                      >
                        {col.label}
                        <SortIcon current={col.key} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const cup = Number(r.balanceCup ?? 0);
                  const usd = Number(r.balanceUsd ?? 0);
                  return (
                    <tr key={r.id} className="border-b border-black/5 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                        <Link href={`/remeseros/${r.id}`} className="hover:underline">{r.name}</Link>
                      </td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-medium", cup > 0 ? "text-green-600" : cup < 0 ? "text-red-600" : "text-muted-foreground")}>
                        {cup.toLocaleString()}
                      </td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-medium", usd > 0 ? "text-green-600" : usd < 0 ? "text-red-600" : "text-muted-foreground")}>
                        {usd.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {r.lastCuadreAt?.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} de {rows.length} remeseros
      </p>
    </div>
  );
}
