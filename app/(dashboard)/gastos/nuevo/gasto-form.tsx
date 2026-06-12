"use client";
import { useState, useTransition } from "react";
import { createExpenseAction } from "@/server/actions/expense";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GastoForm({ categories, accounts }: { categories: { id: number; name: string }[]; accounts: { id: number; name: string; currency: string }[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<"CUP" | "USD">("CUP");
  const [amount, setAmount] = useState(0);
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id ?? 0);
  const [pending, start] = useTransition();

  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { await createExpenseAction({ date: new Date(), categoryId, description, cupAmount: currency === "CUP" ? amount : 0, usdAmount: currency === "USD" ? amount : 0, fromAccountId }); setAmount(0); setDescription(""); }); }} className="space-y-3 max-w-md">
      <div><label className="text-sm">Categoría</label><Select value={String(categoryId)} onValueChange={(v) => setCategoryId(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
      <div><label className="text-sm">Descripción</label><Input value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-sm">Moneda</label><Select value={currency} onValueChange={(v) => setCurrency(v as never)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select></div>
        <div><label className="text-sm">Monto</label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
      </div>
      <div><label className="text-sm">Cuenta origen</label><Select value={String(fromAccountId)} onValueChange={(v) => setFromAccountId(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent></Select></div>
      <Button type="submit" disabled={pending || amount <= 0}>{pending ? "..." : "Registrar"}</Button>
    </form>
  );
}
