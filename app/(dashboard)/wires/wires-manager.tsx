"use client";
import { useState, useTransition } from "react";
import { Check, Edit2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWireItem, deactivateWireItem, updateWireItem } from "@/server/actions/wire-item";
import { cn } from "@/lib/utils";

type Wire = {
  id: number;
  name: string;
  amount: string | null;
  currency: string;
  direction: string;
  notes: string | null;
  isActive: boolean;
};

function fmt(n: number) {
  return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : "";
}

function parseAmount(value: string) {
  return Number(value.replace(/\D/g, "")) || 0;
}

function formatInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("es-ES", { useGrouping: true }) : "";
}

export function WiresManager({ wires }: { wires: Wire[] }) {
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
    const n = parseAmount(amount);
    if (!name || !n) return;
    start(async () => {
      await createWireItem({ name, amount: n, currency, direction, notes: notes || undefined });
      setName("");
      setAmount("");
      setNotes("");
    });
  };

  const startEdit = (wire: Wire) => {
    setEditingId(wire.id);
    setEditName(wire.name);
    setEditAmount(fmt(Number(wire.amount ?? 0)));
    setEditCurrency(wire.currency as "CUP" | "USD");
    setEditDirection(wire.direction as "me_deben" | "debo");
    setEditNotes(wire.notes ?? "");
  };

  const saveEdit = () => {
    const n = parseAmount(editAmount);
    if (!editingId || !editName || !n) return;
    start(async () => {
      await updateWireItem(editingId, {
        name: editName,
        amount: n,
        currency: editCurrency,
        direction: editDirection,
        notes: editNotes || undefined,
      });
      setEditingId(null);
    });
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="card-apple p-4 space-y-3">
        <Input placeholder="Nombre / descripción" value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(formatInput(e.target.value))}
            className="text-sm flex-1"
          />
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
        <Button size="sm" className="w-full" disabled={pending || !name || !amount} onClick={create}>Agregar wire</Button>
      </div>

      <div className="space-y-2">
        {wires.filter((wire) => wire.isActive).map((wire) => {
          if (editingId === wire.id) {
            return (
              <div key={wire.id} className="card-apple p-4 space-y-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm" />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={editAmount}
                    onChange={(e) => setEditAmount(formatInput(e.target.value))}
                    className="text-sm flex-1"
                  />
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
            <div key={wire.id} className="card-apple p-4 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{wire.name}</div>
                  <div className={cn("text-sm font-semibold tabular-nums", wire.direction === "me_deben" ? "text-green-600" : "text-red-600")}>
                    {wire.direction === "me_deben" ? "+" : "-"}{fmt(Number(wire.amount ?? 0))} {wire.currency}
                  </div>
                  {wire.notes && <div className="text-xs text-muted-foreground truncate">{wire.notes}</div>}
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(wire)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600" onClick={() => deactivateWireItem(wire.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
