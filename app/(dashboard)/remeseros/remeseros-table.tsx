"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Edit2, FileText, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createRemeseroAction,
  deactivateRemeseroAction,
  deleteRemeseroPermanentlyAction,
  updateRemeseroAction,
} from "@/server/actions/remesero";

type RemeseroRow = {
  id: number;
  name: string;
  balanceCup: string | null;
  balanceUsd: string | null;
  lastCuadreAt: string | null;
  lastLabel: string | null;
};

type SortKey = "name" | "balanceCup" | "balanceUsd" | "lastCuadreAt";
type SortDir = "asc" | "desc";

export function RemeserosTable({ rows }: { rows: RemeseroRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastCuadreAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [pending, start] = useTransition();
  const [deactivateOpen, setDeactivateOpen] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<number | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    const result = rows.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()));
    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (sortKey === "name") return dir * a.name.localeCompare(b.name);
      if (sortKey === "lastCuadreAt") return dir * ((a.lastCuadreAt ? new Date(a.lastCuadreAt).getTime() : 0) - (b.lastCuadreAt ? new Date(b.lastCuadreAt).getTime() : 0));
      return dir * (Number(a[sortKey] ?? 0) - Number(b[sortKey] ?? 0));
    });
    return result;
  }, [rows, search, sortKey, sortDir]);

  const SortIcon = ({ current }: { current: SortKey }) => {
    if (sortKey !== current) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar remesero..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}><X className="h-4 w-4 mr-1" />Limpiar</Button>}
        <div className="flex gap-1 items-end">
          <Input placeholder="Nuevo remesero" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-sm w-36" />
          <Button size="sm" className="h-9" disabled={pending || !newName.trim()} onClick={() => start(async () => {
            await createRemeseroAction(newName.trim());
            setNewName("");
          })}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{search ? "No se encontraron" : "No hay remeseros"}</div>
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
                    { key: "lastCuadreAt" as const, label: "Ultimo cuadre" },
                  ].map((col) => (
                    <th key={col.key} className={cn("px-4 py-3 font-medium text-muted-foreground text-xs", col.right ? "text-right" : "text-left")}>
                      <button onClick={() => toggleSort(col.key)} className={cn("inline-flex items-center gap-1 hover:text-foreground", sortKey === col.key && "text-foreground font-semibold")}>
                        {col.label}<SortIcon current={col.key} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const cup = Number(r.balanceCup ?? 0);
                  const usd = Number(r.balanceUsd ?? 0);
                  const isDeuda = r.lastLabel === "deuda";
                  const isFondo = r.lastLabel === "fondo";
                  return (
                    <tr key={r.id} className="border-b border-black/5 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[120px] truncate">
                        {editingId === r.id ? (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!editName.trim()) return;
                            start(async () => {
                              await updateRemeseroAction(r.id, editName.trim());
                              setEditingId(null);
                            });
                          }} className="flex gap-1">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-xs" autoFocus />
                            <Button size="sm" className="h-7 w-7 p-0" type="submit" disabled={pending}><Check className="h-3 w-3" /></Button>
                          </form>
                        ) : (
                          <Link href={`/remeseros/${r.id}`} className="hover:underline">{r.name}</Link>
                        )}
                      </td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", isDeuda ? "text-red-600" : isFondo ? "text-green-600" : cup > 0 ? "text-red-600" : cup < 0 ? "text-green-600" : "text-muted-foreground")}>
                        {cup.toLocaleString()}
                      </td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", usd > 0 ? "text-red-600" : usd < 0 ? "text-green-600" : "text-muted-foreground")}>
                        {usd.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {r.lastCuadreAt ? new Date(r.lastCuadreAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex gap-0.5 justify-end">
                          <Link href={`/nuevo?tab=cuadre&remesero=${encodeURIComponent(r.name)}`} className="inline-flex items-center gap-1 h-8 text-xs rounded-md border px-2.5 hover:bg-accent transition-colors">
                            <FileText className="h-3 w-3" />Cuadre
                          </Link>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => {
                            setEditingId(r.id);
                            setEditName(r.name);
                          }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Dialog open={deactivateOpen === r.id} onOpenChange={(v) => setDeactivateOpen(v ? r.id : null)}>
                            <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>} />
                            <DialogContent>
                              <DialogHeader><DialogTitle>Desactivar remesero</DialogTitle></DialogHeader>
                              <p className="text-sm text-muted-foreground">Desactivar a {r.name}. Sus cuadres se conservan y este cambio se puede deshacer.</p>
                              <DialogFooter>
                                <Button variant="outline" size="sm" onClick={() => setDeactivateOpen(null)}>Cancelar</Button>
                                <Button variant="destructive" size="sm" disabled={pending} onClick={() => start(async () => {
                                  await deactivateRemeseroAction(r.id);
                                  setDeactivateOpen(null);
                                })}>{pending ? "..." : "Desactivar"}</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={deleteOpen === r.id} onOpenChange={(v) => setDeleteOpen(v ? r.id : null)}>
                            <DialogTrigger render={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600">Eliminar</Button>} />
                            <DialogContent>
                              <DialogHeader><DialogTitle>Eliminar permanentemente</DialogTitle></DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                Se eliminara permanentemente a {r.name}. Solo se permite si no tiene cuadres ni movimientos USD; si procede, podras deshacerlo desde la barra superior.
                              </p>
                              <DialogFooter>
                                <Button variant="outline" size="sm" onClick={() => setDeleteOpen(null)}>Cancelar</Button>
                                <Button variant="destructive" size="sm" disabled={pending} onClick={() => start(async () => {
                                  await deleteRemeseroPermanentlyAction(r.id);
                                  setDeleteOpen(null);
                                })}>{pending ? "..." : "Eliminar"}</Button>
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
      <p className="text-xs text-muted-foreground text-right">{filtered.length} de {rows.length} remeseros</p>
    </div>
  );
}
