"use client";
import { useState, useTransition } from "react";
import { addWirePaymentAction } from "@/server/actions/wire";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatInputNumber, parseInputNumber } from "@/lib/format";

export function PaymentForm({ wireId, wireBuyerId }: { wireId: number; wireBuyerId: number }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const parsedAmount = parseInputNumber(amount);

  return (
    <div className="card-apple p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Registrar pago</h3>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground">CUP</label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="50,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex-[2] min-w-[200px]">
          <label className="text-xs text-muted-foreground">Nota</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: primer abono"
            className="mt-1"
          />
        </div>
        <Button
          type="submit"
          disabled={pending || parsedAmount <= 0}
          onClick={() => {
            start(async () => {
              await addWirePaymentAction({ wireId, wireBuyerId, date: new Date(), cupAmount: parsedAmount, note: note || undefined });
              setAmount(""); setNote("");
            });
          }}
        >
          {pending ? "..." : "Registrar pago"}
        </Button>
      </div>
    </div>
  );
}
