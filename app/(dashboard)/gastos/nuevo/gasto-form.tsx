"use client";
import { useState, useTransition } from "react";
import { createExpenseAction } from "@/server/actions/expense";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : ""; }
function unfmt(s: string) { return Number(s.replace(/\D/g, "")) || 0; }

export function GastoForm({ categories }: { categories: { id: number; name: string }[] }) {
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id ?? ""));
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<"CUP" | "USD">("CUP");
  const [amountRaw, setAmountRaw] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const amount = unfmt(amountRaw);

  return (
    <div className="max-w-md space-y-4">
      <div className="card-apple p-4 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase">Categoría</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Gasolina semanal" className="mt-1" />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Moneda</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={currency === "CUP" ? "default" : "outline"} className="flex-1" onClick={() => setCurrency("CUP")}>CUP</Button>
            <Button size="sm" variant={currency === "USD" ? "default" : "outline"} className="flex-1" onClick={() => setCurrency("USD")}>USD</Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Monto</Label>
          <Input type="text" inputMode="numeric" placeholder="0" value={amountRaw}
            onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setAmountRaw(d ? Number(d).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
            className="mt-1" />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Nota (opcional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1" />
        </div>
      </div>

      <Button className="w-full" onClick={() => start(async () => {
        await createExpenseAction({
          date: new Date(),
          categoryId: Number(categoryId),
          description: description || "Sin descripción",
          cupAmount: currency === "CUP" ? amount : 0,
          usdAmount: currency === "USD" ? amount : 0,
          note: note || undefined,
        });
        setDescription(""); setAmountRaw(""); setNote("");
      })} disabled={pending || !amount || !description}>
        {pending ? "..." : "Registrar gasto"}
      </Button>
    </div>
  );
}
