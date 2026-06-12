"use client";
import { useState, useTransition } from "react";
import { parseCuadre, type ParsedCuadre } from "@/components/cuadre-parser/parser";
import { createCuadreAction } from "@/server/actions/cuadre";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const empty: ParsedCuadre = {
  remesero: null, balanceInicialCup: null, pagadoCup: 0,
  pendientes: { usd: 0, tasa: 0 }, tirado: [],
  balanceFinalCup: null, balanceFinalLabel: null,
};

export function CuadreForm() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedCuadre>(empty);
  const [tirado, setTirado] = useState<Array<{ usd: number; tasa: number }>>([]);
  const [pending, start] = useTransition();

  const onTextChange = (v: string) => {
    setText(v);
    if (v.length > 20) {
      const p = parseCuadre(v);
      setParsed(p);
      setTirado(p.tirado);
    }
  };

  const submit = () => {
    if (!parsed.remesero || parsed.balanceInicialCup == null || parsed.balanceFinalCup == null || !parsed.balanceFinalLabel) {
      alert("Datos incompletos");
      return;
    }
    start(async () => {
      await createCuadreAction({
        remeseroName: parsed.remesero,
        date: new Date(),
        balanceInicialCup: parsed.balanceInicialCup!,
        pagadoCup: parsed.pagadoCup,
        pendientes: parsed.pendientes,
        tirado,
        balanceFinalCup: parsed.balanceFinalCup!,
        balanceFinalLabel: parsed.balanceFinalLabel!,
        rawText: text,
      });
      setText(""); setParsed(empty); setTirado([]);
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label>Texto del cuadre</Label>
        <Textarea rows={20} value={text} onChange={(e) => onTextChange(e.target.value)} placeholder="Pega aquí el cuadre del grupo de WhatsApp..." />
      </div>
      <div className="space-y-3 rounded border p-3">
        <div><span className="text-sm text-muted-foreground">Remesero:</span> <strong>{parsed.remesero ?? "—"}</strong></div>
        <div><span className="text-sm text-muted-foreground">Balance inicial:</span> {parsed.balanceInicialCup?.toLocaleString() ?? "—"}</div>
        <div><span className="text-sm text-muted-foreground">Pagado:</span> {parsed.pagadoCup.toLocaleString()}</div>
        <div>
          <span className="text-sm text-muted-foreground">Tirado:</span>
          <ul className="text-sm">{tirado.map((t, i) => <li key={i}>{t.usd.toLocaleString()} × {t.tasa}</li>)}</ul>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Balance final:</span> {parsed.balanceFinalCup?.toLocaleString() ?? "—"}
          {parsed.balanceFinalLabel && <span className="ml-2 text-sm">({parsed.balanceFinalLabel})</span>}
        </div>
        <Button onClick={submit} disabled={pending || !parsed.remesero}>
          {pending ? "Registrando..." : "Registrar cuadre"}
        </Button>
      </div>
    </div>
  );
}
