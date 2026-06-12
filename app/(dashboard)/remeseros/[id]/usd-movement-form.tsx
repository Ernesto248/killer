"use client";
import { useState, useTransition } from "react";
import { addRemeseroUsdMovement } from "@/server/actions/remesero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UsdMovementForm({ remeseroId }: { remeseroId: number }) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { await addRemeseroUsdMovement({ remeseroId, date: new Date(), amount, note }); setAmount(0); setNote(""); }); }} className="flex flex-wrap items-end gap-2 rounded border p-3">
      <div><label className="text-sm">Monto USD</label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
      <div className="flex-1 min-w-[200px]"><label className="text-sm">Nota</label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <Button type="submit" disabled={pending}>{pending ? "..." : "Registrar"}</Button>
    </form>
  );
}
