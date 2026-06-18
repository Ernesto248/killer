"use client";
import { useState, useTransition } from "react";
import { createExternalDebt, deactivateExternalDebt, updateExternalDebt } from "@/server/actions/balance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Debt = { id: number; name: string; amount: string | null; currency: string; direction: string; notes: string | null; isActive: boolean };

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : ""; }

export function DeudasManager({ debts }: { debts: Debt[] }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"CUP" | "USD">("USD");
  const [direction, setDirection] = useState<"me_deben" | "debo">("me_deben");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState<"CUP" | "USD">("USD");
  const [editDirection, setEditDirection] = useState<"me_deben" | "debo">("me_deben");
  const [editNotes, setEditNotes] = useState("");

  const create = () => {
    const n = Number(amount.replace(/\D/g, "")) || 0;
    if (!name || !n) return;
    start(async () => {
      await createExternalDebt({ name, amount: n, currency, direction, notes: notes || undefined });
      setName(""); setAmount(""); setNotes("");
    });
  };

  const startEdit = (d: Debt) => {
    setEditingId(d.id);
    setEditName(d.name);
    setEditAmount(fmt(Number(d.amount ?? 0)));
    setEditCurrency(d.currency as "CUP" | "USD");
    setEditDirection(d.direction as "me_deben" | "debo");
    setEditNotes(d.notes ?? "");
  };

  const saveEdit = () => {
    const n = Number(editAmount.replace(/\D/g, "")) || 0;
    if (!editName || !n) return;
    start(async () => {
      await updateExternalDebt(editingId!, { name: editName, amount: n, currency: editCurrency, direction: editDirection, notes: editNotes || undefined });
      setEditingId(null);
    });
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="card-apple p-4 space-y-3">
        <Input placeholder="Nombre / descripción" value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
        <div className="flex gap-2">
          <Input type="text" inputMode="numeric" placeholder="Monto" value={amount}
            onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setAmount(d ? Number(d).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
            className="text-sm flex-1" />
          <div className="flex gap-1">
            <Button size="sm" variant={currency === "USD" ? "default" : "outline"} className="h-9 text-xs" onClick={() => setCurrency("USD")}>USD</Button>
            <Button size="sm" variant={currency === "CUP" ? "default" : "outline"} className="h-9 text-xs" onClick={() => setCurrency("CUP")}>CUP</Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={direction === "me_deben" ? "default" : "outline"} className="flex-1" onClick={() => setDirection("me_deben")}>Me deben</Button>
          <Button size="sm" variant={direction === "debo" ? "default" : "outline"} className="flex-1" onClick={() => setDirection("debo")}>Debo</Button>
        </div>
        <Input placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm" />
        <Button size="sm" className="w-full" disabled={pending || !name || !amount} onClick={create}>Agregar</Button>
      </div>

      <div className="space-y-2">
        {debts.filter((d) => d.isActive).map((d) => {
          if (editingId === d.id) {
            return (
              <div key={d.id} className="card-apple p-4 space-y-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm" />
                <div className="flex gap-2">
                  <Input type="text" inputMode="numeric" value={editAmount}
                    onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setEditAmount(v ? Number(v).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
                    className="text-sm flex-1" />
                  <Button size="sm" variant={editCurrency === "USD" ? "default" : "outline"} className="h-9 text-xs" onClick={() => setEditCurrency("USD")}>USD</Button>
                  <Button size="sm" variant={editCurrency === "CUP" ? "default" : "outline"} className="h-9 text-xs" onClick={() => setEditCurrency("CUP")}>CUP</Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={editDirection === "me_deben" ? "default" : "outline"} className="flex-1" onClick={() => setEditDirection("me_deben")}>Me deben</Button>
                  <Button size="sm" variant={editDirection === "debo" ? "default" : "outline"} className="flex-1" onClick={() => setEditDirection("debo")}>Debo</Button>
                </div>
                <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notas" className="text-sm" />
                <div className="flex gap-1 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  <Button size="sm" onClick={saveEdit} disabled={pending}><Check className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          }
          return (
            <div key={d.id} className="card-apple p-4 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{d.name}</div>
                  <div className={cn("text-sm font-semibold tabular-nums", d.direction === "me_deben" ? "text-green-600" : "text-red-600")}>
                    {d.direction === "me_deben" ? "+" : "−"}{fmt(Number(d.amount ?? 0))} {d.currency}
                  </div>
                  {d.notes && <div className="text-xs text-muted-foreground truncate">{d.notes}</div>}
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => startEdit(d)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => deactivateExternalDebt(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
