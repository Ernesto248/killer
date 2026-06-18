"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateBalanceManual, updateZelleBalance, updateTasaGlobalAction } from "@/server/actions/balance";

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : ""; }

export function EditableBalance({ label, value, suffix, accountId, zelleId, isTasa }: {
  label: string; value: number; suffix: string;
  accountId?: number; zelleId?: number; isTasa?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(fmt(value));
  const [pending, start] = useTransition();

  const save = () => {
    const n = Number(val.replace(/\D/g, "")) || 0;
    start(async () => {
      if (isTasa) await updateTasaGlobalAction(n);
      else if (zelleId) await updateZelleBalance(zelleId, n);
      else if (accountId) await updateBalanceManual(accountId, n);
      setEditing(false);
    });
  };

  const isNeg = value < 0;

  return (
    <div className={cn("card-apple p-4", isNeg ? "bg-red-50/40" : "bg-green-50/40")}
      onDoubleClick={() => { if (accountId || zelleId || isTasa) setEditing(true); }}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="mt-1 flex gap-1">
          <Input type="text" inputMode="numeric" value={val}
            onChange={(e) => { const d = e.target.value.replace(/[^\d-]/g, ""); setVal(d ? Number(d).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
            className="h-8 text-sm" autoFocus />
          <button type="submit" className="text-xs text-primary font-medium px-2" disabled={pending}>✓</button>
        </form>
      ) : (
        <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1 cursor-pointer hover:opacity-80", isNeg ? "text-red-600" : "text-green-600")}
          title="Doble click para editar">
          {value >= 0 ? "+" : ""}{fmt(value)} {suffix}
        </div>
      )}
    </div>
  );
}
