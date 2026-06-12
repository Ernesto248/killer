"use client";
import { useState, useTransition } from "react";
import { createWireAction } from "@/server/actions/wire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: number; name: string; currency: string };
type Split = { destinoAccountId: number; usdAmount: number; tasaDestino: number };

export function WireForm({ accounts }: { accounts: Account[] }) {
  const [buyerName, setBuyerName] = useState("");
  const [usdAmount, setUsdAmount] = useState(0);
  const [tasaCup, setTasaCup] = useState(530);
  const [splits, setSplits] = useState<Split[]>([]);
  const [pending, start] = useTransition();

  const addSplit = () => setSplits([...splits, { destinoAccountId: accounts[0]?.id ?? 0, usdAmount: 0, tasaDestino: 660 }]);
  const totalSplitUsd = splits.reduce((a, s) => a + s.usdAmount, 0);
  const valid = buyerName && Math.abs(totalSplitUsd - usdAmount) < 0.01 && splits.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 max-w-2xl">
        <div><label className="text-sm">Wire buyer</label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} /></div>
        <div><label className="text-sm">Tasa referencia (CUP/USD)</label><Input type="number" value={tasaCup} onChange={(e) => setTasaCup(Number(e.target.value))} /></div>
        <div><label className="text-sm">USD total</label><Input type="number" value={usdAmount} onChange={(e) => setUsdAmount(Number(e.target.value))} /></div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Split a cuentas fisicas</h3>
        {splits.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Select value={String(s.destinoAccountId)} onValueChange={(v) => { const c = [...splits]; c[i].destinoAccountId = Number(v); setSplits(c); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="USD" value={s.usdAmount} onChange={(e) => { const c = [...splits]; c[i].usdAmount = Number(e.target.value); setSplits(c); }} className="w-32" />
            <Input type="number" placeholder="Tasa" value={s.tasaDestino} onChange={(e) => { const c = [...splits]; c[i].tasaDestino = Number(e.target.value); setSplits(c); }} className="w-32" />
            <Button variant="ghost" size="sm" onClick={() => setSplits(splits.filter((_, j) => j !== i))}>×</Button>
          </div>
        ))}
        <Button variant="outline" onClick={addSplit}>+ Añadir split</Button>
      </div>
      <div className="text-sm">
        Total split USD: <strong className="tabular-nums">{totalSplitUsd.toLocaleString()}</strong> / {usdAmount.toLocaleString()}
        {Math.abs(totalSplitUsd - usdAmount) > 0.01 && <span className="ml-2 text-red-500">(no coincide)</span>}
      </div>
      <Button disabled={!valid || pending} onClick={() => { start(async () => { await createWireAction({ wireBuyerName: buyerName, date: new Date(), usdAmount, tasaCup, splits }); }); }}>{pending ? "..." : "Registrar wire"}</Button>
    </div>
  );
}
