"use client";
import { useState, useMemo, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronUp, ChevronDown, X, Plus, Trash2, Edit2, Check, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createWireBuyerAction, updateWireBuyerAction, deactivateWireBuyerAction } from "@/server/actions/wire";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

type Row = { id: number; name: string; balanceCup: string | null; balanceUsd: string | null };

type SortKey = "name" | "balanceCup" | "balanceUsd";
type SortDir = "asc" | "desc";

function fmt(n: number) { return n.toLocaleString("es-ES", { useGrouping: true }); }

export function WireBuyersTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("balanceCup");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [pending, start] = useTransition();
  const [delOpen, setDelOpen] = useState<number | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ current }: { current: SortKey }) => {
    if (sortKey !== current) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />;
  };

  const filtered = useMemo(() => {
    let result = rows.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()));
    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortKey === "name") return dir * (a.name.localeCompare(b.name));
      return dir * (Number((a as any)[sortKey] ?? 0) - Number((b as any)[sortKey] ?? 0));
    });
    return result;
  }, [rows, search, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar wire buyer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="h-4 w-4 mr-1" />Limpiar</Button>}
        <div className="flex gap-1 items-end">
          <Input placeholder="Nuevo buyer" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-sm w-36" />
          <Button size="sm" className="h-9" disabled={pending || !newName.trim()} onClick={() => start(async () => {
            await createWireBuyerAction(newName.trim()); setNewName("");
          })}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{search ? "No se encontraron" : "No hay wire buyers"}</div>
      ) : (
        <div className="card-apple overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-muted/40">
                  {[
                    { key: "name" as const, label: "Nombre" },
                    { key: "balanceCup" as const, label: "Balance CUP", right: true },
                    { key: "balanceUsd" as const, label: "Balance USD", right: true },
                  ].map((col) => (
                    <th key={col.key} className={cn("px-4 py-3 font-medium text-muted-foreground text-xs", col.right ? "text-right" : "text-left")}>
                      <button onClick={() => toggleSort(col.key)} className={cn("inline-flex items-center gap-1 hover:text-foreground", sortKey === col.key && "text-foreground font-semibold")}>
                        {col.label}<SortIcon current={col.key} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const cup = Number(r.balanceCup ?? 0);
                  const usd = Number(r.balanceUsd ?? 0);
                  return (
                    <tr key={r.id} className="border-b border-black/5 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">
                        {editingId === r.id ? (
                          <form onSubmit={async (e) => { e.preventDefault(); if (editName.trim()) { start(async () => { await updateWireBuyerAction(r.id, editName.trim()); setEditingId(null); }); } }} className="flex gap-1">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-xs" autoFocus />
                            <Button size="sm" className="h-7 w-7 p-0" type="submit" disabled={pending}><Check className="h-3 w-3" /></Button>
                          </form>
                        ) : (
                          <Link href={`/wire-buyers/${r.id}`} className="hover:underline">{r.name}</Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600">
                        {cup > 0 ? fmt(cup) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600">
                        {usd > 0 ? fmt(usd) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex gap-0.5 justify-end">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => { setEditingId(r.id); setEditName(r.name); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Dialog open={delOpen === r.id} onOpenChange={(v) => setDelOpen(v ? r.id : null)}>
                            <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>} />
                            <DialogContent>
                              <DialogHeader><DialogTitle>Eliminar wire buyer</DialogTitle></DialogHeader>
                              <p className="text-sm text-muted-foreground">¿Desactivar a {r.name}? Sus wires se conservan.</p>
                              <DialogFooter>
                                <Button variant="outline" size="sm" onClick={() => setDelOpen(null)}>Cancelar</Button>
                                <Button variant="destructive" size="sm" disabled={pending} onClick={() => start(async () => { await deactivateWireBuyerAction(r.id); setDelOpen(null); })}>
                                  {pending ? "..." : "Desactivar"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-right">{filtered.length} de {rows.length} wire buyers</p>
    </div>
  );
}
