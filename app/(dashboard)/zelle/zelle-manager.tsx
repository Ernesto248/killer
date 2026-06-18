"use client";
import { useState, useTransition } from "react";
import { createZelleAccount, updateZelleBalance, deactivateZelleAccount } from "@/server/actions/balance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

type Zelle = { id: number; name: string; bank: string | null; balanceUsd: string | null; isActive: boolean };

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : ""; }

export function ZelleManager({ accounts }: { accounts: Zelle[] }) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [pending, start] = useTransition();

  const active = accounts.filter((a) => a.isActive);

  return (
    <div className="max-w-md space-y-4">
      <div className="card-apple p-4 space-y-3">
        <Input placeholder="Nombre de la cuenta" value={name} onChange={(e) => setName(e.target.value)} className="text-sm" />
        <Input placeholder="Banco (opcional)" value={bank} onChange={(e) => setBank(e.target.value)} className="text-sm" />
        <Button size="sm" disabled={pending || !name} onClick={() => start(async () => {
          await createZelleAccount({ name, bank: bank || undefined });
          setName(""); setBank("");
        })}>Crear cuenta Zelle</Button>
      </div>

      <div className="space-y-2">
        {active.map((a) => {
          const bal = Number(a.balanceUsd ?? 0);
          return (
            <div key={a.id} className="card-apple p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{a.name}</div>
                {a.bank && <div className="text-xs text-muted-foreground">{a.bank}</div>}
                <div className={bal >= 0 ? "text-green-600" : "text-red-600"}>
                  <EditableCell value={bal} onSave={(v) => updateZelleBalance(a.id, v)} /> USD
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                onClick={() => deactivateZelleAccount(a.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditableCell({ value, onSave }: { value: number; onSave: (v: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(fmt(value));
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); start(async () => { await onSave(Number(val.replace(/\D/g, "")) || 0); setEditing(false); }); }} className="inline-flex items-center gap-1">
        <Input type="text" inputMode="numeric" value={val}
          onChange={(e) => { const d = e.target.value.replace(/[^\d-]/g, ""); setVal(d ? Number(d).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
          className="h-7 w-24 text-xs" autoFocus />
        <button type="submit" className="text-xs text-primary" disabled={pending}>✓</button>
      </form>
    );
  }
  return (
    <span className="tabular-nums font-semibold cursor-pointer hover:opacity-80" onClick={() => setEditing(true)}>
      {fmt(value)}
    </span>
  );
}
