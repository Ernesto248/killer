"use client";
import { useState, useTransition } from "react";
import { createWireAction } from "@/server/actions/wire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatInputNumber, parseInputNumber } from "@/lib/format";
import { Info } from "lucide-react";

type Account = { id: number; name: string; currency: string; type: string };
type Split = { destinoAccountId: number; usdAmount: string; tasaDestino: string };

export function WireForm({ accounts }: { accounts: Account[] }) {
  const [buyerName, setBuyerName] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [tasaCup, setTasaCup] = useState("650");
  const [nota, setNota] = useState("");
  const [splits, setSplits] = useState<Split[]>([]);
  const [pending, start] = useTransition();

  const usd = parseInputNumber(usdAmount);
  const tasa = parseInputNumber(tasaCup);
  const cupTotal = usd * tasa;
  const totalSplitUsd = splits.reduce((a, s) => a + parseInputNumber(s.usdAmount), 0);

  const addSplit = () => setSplits([...splits, { destinoAccountId: accounts[1]?.id ?? 0, usdAmount: "", tasaDestino: "" }]);
  const valid = buyerName && usd > 0 && tasa > 0 && Math.abs(totalSplitUsd - usd) < 0.01 && splits.length > 0;

  const submit = () => {
    start(async () => {
      await createWireAction({
        wireBuyerName: buyerName,
        date: new Date(),
        usdAmount: usd,
        tasaCup: tasa,
        splits: splits.map((s) => ({
          destinoAccountId: s.destinoAccountId,
          usdAmount: parseInputNumber(s.usdAmount),
          tasaDestino: parseInputNumber(s.tasaDestino),
        })),
        nota: nota || undefined,
      });
      setBuyerName(""); setUsdAmount(""); setTasaCup("650"); setNota(""); setSplits([]);
    });
  };

  const llcAccount = accounts.find((a) => a.type === "llc_usa");

  return (
    <div className="max-w-lg space-y-5">
      <div className="card-apple p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase">Wire buyer</label>
          <Input placeholder="Nombre del comprador" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">USD</label>
            <Input type="text" inputMode="numeric" placeholder="10,000" value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Tasa (CUP/USD)</label>
            <Input type="text" inputMode="numeric" placeholder="650" value={tasaCup} onChange={(e) => setTasaCup(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase">Total CUP</div>
            <div className="text-xl font-semibold tabular-nums">{formatInputNumber(cupTotal)}</div>
          </div>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="card-apple p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cuentas destino</h3>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={addSplit}>+ Añadir</Button>
        </div>

        <div className="rounded-lg bg-muted/30 p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Origen</span>
          <span className="font-medium">{llcAccount?.name ?? "LLC USA"} ({llcAccount?.currency ?? "USD"})</span>
        </div>

        {splits.map((s, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-black/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Destino #{i + 1}</span>
              <Button variant="ghost" size="sm" className="h-6 px-1 text-xs text-muted-foreground" onClick={() => setSplits(splits.filter((_, j) => j !== i))}>Quitar</Button>
            </div>
            <Select value={String(s.destinoAccountId)} onValueChange={(v) => { const c = [...splits]; c[i].destinoAccountId = Number(v); setSplits(c); }}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="text" inputMode="numeric" placeholder="USD" value={s.usdAmount} onChange={(e) => { const c = [...splits]; c[i].usdAmount = e.target.value; setSplits(c); }} className="h-9 text-sm" />
              <Input type="text" inputMode="numeric" placeholder="Tasa" value={s.tasaDestino} onChange={(e) => { const c = [...splits]; c[i].tasaDestino = e.target.value; setSplits(c); }} className="h-9 text-sm" />
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase">Nota (opcional)</label>
        <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: Wire a Miguel" className="mt-1" />
      </div>

      <div className="text-xs text-muted-foreground">
        Total split: <span className={`tabular-nums font-semibold ${Math.abs(totalSplitUsd - usd) > 0.01 && usd > 0 ? "text-red-600" : ""}`}>{formatInputNumber(totalSplitUsd)} USD</span>
        {usd > 0 && Math.abs(totalSplitUsd - usd) > 0.01 && <span className="ml-1 text-red-600">(debe sumar {formatInputNumber(usd)})</span>}
      </div>

      <Button className="w-full" onClick={submit} disabled={pending || !valid}>
        {pending ? "Registrando..." : "Registrar wire"}
      </Button>
    </div>
  );
}
