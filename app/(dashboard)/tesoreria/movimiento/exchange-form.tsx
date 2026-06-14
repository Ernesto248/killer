"use client";
import { useState, useTransition } from "react";
import { createExchangeAction } from "@/server/actions/exchange";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : ""; }
function unfmt(s: string) { return Number(s.replace(/\D/g, "")) || 0; }

export function ExchangeForm() {
  const [direction, setDirection] = useState<"compra_usd" | "venta_usd">("compra_usd");
  const [usdRaw, setUsdRaw] = useState("");
  const [tasaRaw, setTasaRaw] = useState("");
  const [pending, start] = useTransition();

  const usd = unfmt(usdRaw);
  const tasa = unfmt(tasaRaw);
  const cup = usd * tasa;

  return (
    <div className="max-w-md space-y-4">
      <div className="card-apple p-4 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase">Operación</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={direction === "compra_usd" ? "default" : "outline"} className="flex-1" onClick={() => setDirection("compra_usd")}>
              Comprar USD
            </Button>
            <Button size="sm" variant={direction === "venta_usd" ? "default" : "outline"} className="flex-1" onClick={() => setDirection("venta_usd")}>
              Vender USD
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase">USD</Label>
            <Input type="text" inputMode="numeric" placeholder="100" value={usdRaw}
              onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setUsdRaw(d ? Number(d).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
              className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase">Tasa (CUP/USD)</Label>
            <Input type="text" inputMode="numeric" placeholder="660" value={tasaRaw}
              onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setTasaRaw(d ? Number(d).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
              className="mt-1" />
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {direction === "compra_usd" ? "Pagás" : "Recibís"} en CUP
          </span>
          <span className="text-lg font-semibold tabular-nums">{fmt(cup)} CUP</span>
        </div>
      </div>

      <Button className="w-full" onClick={() => start(async () => {
        await createExchangeAction({ date: new Date(), direction, usdAmount: usd, tasa });
        setUsdRaw(""); setTasaRaw("");
      })} disabled={pending || !usd || !tasa}>
        {pending ? "..." : direction === "compra_usd" ? "Comprar USD" : "Vender USD"}
      </Button>
    </div>
  );
}
