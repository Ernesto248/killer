"use client";
import { useState, useTransition } from "react";
import { createExternalDebt, deactivateExternalDebt } from "@/server/actions/balance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Debt = { id: number; name: string; amount: string | null; currency: string; direction: string; isActive: boolean };

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : ""; }

export function DeudasManager({ debts }: { debts: Debt[] }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"CUP" | "USD">("USD");
  const [direction, setDirection] = useState<"me_deben" | "debo">("me_deben");
  const [pending, start] = useTransition();

  const create = () => {
    const n = Number(amount.replace(/\D/g, "")) || 0;
    if (!name || !n) return;
    start(async () => {
      await createExternalDebt({ name, amount: n, currency, direction });
      setName(""); setAmount("");
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

        <Button size="sm" className="w-full" disabled={pending || !name || !amount} onClick={create}>Agregar deuda</Button>
      </div>

      <div className="space-y-2">
        {debts.filter((d) => d.isActive).map((d) => (
          <div key={d.id} className="card-apple p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{d.name}</div>
              <div className={cn("text-sm font-semibold tabular-nums", d.direction === "me_deben" ? "text-green-600" : "text-red-600")}>
                {d.direction === "me_deben" ? "+" : "−"}{fmt(Number(d.amount ?? 0))} {d.currency}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
              onClick={() => deactivateExternalDebt(d.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
