"use client";
import { useState, useTransition } from "react";
import { createExchangeAction } from "@/server/actions/exchange";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: number; name: string; currency: string };

export function ExchangeForm({ accounts }: { accounts: Account[] }) {
  const [direction, setDirection] = useState<"compra_usd" | "venta_usd">("compra_usd");
  const [usdAmount, setUsdAmount] = useState(0);
  const [tasa, setTasa] = useState(530);
  const [from, setFrom] = useState(accounts[0]?.id ?? 0);
  const [to, setTo] = useState(accounts[1]?.id ?? 0);
  const [pending, start] = useTransition();

  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { await createExchangeAction({ date: new Date(), direction, usdAmount, tasa, fromAccountId: from, toAccountId: to }); setUsdAmount(0); }); }} className="space-y-3 max-w-md">
      <Select value={direction} onValueChange={(v) => setDirection(v as never)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="compra_usd">Comprar USD (pago en CUP)</SelectItem><SelectItem value="venta_usd">Vender USD (recibo CUP)</SelectItem></SelectContent>
      </Select>
      <div><label className="text-sm">USD</label><Input type="number" value={usdAmount} onChange={(e) => setUsdAmount(Number(e.target.value))} /></div>
      <div><label className="text-sm">Tasa</label><Input type="number" value={tasa} onChange={(e) => setTasa(Number(e.target.value))} /></div>
      <div><label className="text-sm">CUP equivalente (auto)</label><Input disabled value={usdAmount * tasa} /></div>
      <div><label className="text-sm">Cuenta origen</label><Select value={String(from)} onValueChange={(v) => setFrom(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent></Select></div>
      <div><label className="text-sm">Cuenta destino</label><Select value={String(to)} onValueChange={(v) => setTo(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent></Select></div>
      <Button type="submit" disabled={pending || usdAmount <= 0}>{pending ? "..." : "Registrar"}</Button>
    </form>
  );
}
