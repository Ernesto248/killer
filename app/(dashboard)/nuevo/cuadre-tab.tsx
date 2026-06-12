"use client";
import { useState, useTransition } from "react";
import { parseCuadre, type ParsedCuadre } from "@/components/cuadre-parser/parser";
import { createCuadreAction } from "@/server/actions/cuadre";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const empty: ParsedCuadre = {
  remesero: null, balanceInicialCup: null, pagadoCup: 0,
  pendientes: { usd: 0, tasa: 0 }, tirado: [],
  balanceFinalCup: null, balanceFinalLabel: null,
};

export function CuadreTab({ remeseros }: { remeseros: Array<{ id: number; name: string }> }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedCuadre>(empty);
  const [tirado, setTirado] = useState<Array<{ usd: number; tasa: number }>>([]);
  const [selectedRemesero, setSelectedRemesero] = useState("");
  const [remeseroOpen, setRemeseroOpen] = useState(false);
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
    if (!selectedRemesero || parsed.balanceInicialCup == null || parsed.balanceFinalCup == null || !parsed.balanceFinalLabel) {
      alert("Datos incompletos — verificá remesero, inicial y final");
      return;
    }
    const name = selectedRemesero;
    start(async () => {
      await createCuadreAction({
        remeseroName: name,
        date: new Date(),
        balanceInicialCup: parsed.balanceInicialCup!,
        pagadoCup: parsed.pagadoCup,
        pendientes: parsed.pendientes,
        tirado,
        balanceFinalCup: parsed.balanceFinalCup!,
        balanceFinalLabel: parsed.balanceFinalLabel!,
        rawText: text,
      });
      setText(""); setParsed(empty); setTirado([]); setSelectedRemesero("");
    });
  };

  const filtered = remeseros.filter((r) =>
    r.name.toLowerCase().includes(selectedRemesero.toLowerCase())
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <Label>Texto del cuadre (WhatsApp)</Label>
        <Textarea rows={16} value={text} onChange={(e) => onTextChange(e.target.value)} placeholder="Pega aquí el cuadre del grupo de WhatsApp..." />
      </div>
      <div className="space-y-4 rounded-xl border border-black/5 bg-card p-4">
        <div>
          <Label className="text-xs text-muted-foreground">Remesero</Label>
          <Popover open={remeseroOpen} onOpenChange={setRemeseroOpen}>
            <PopoverTrigger
              render={<Button variant="outline" role="combobox" className="w-full justify-between mt-1 font-normal">
                {selectedRemesero || "Seleccionar remesero..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>}
            />
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar remesero..." />
                <CommandList>
                  <CommandEmpty>No encontrado — se creará al guardar</CommandEmpty>
                  <CommandGroup>
                    {filtered.map((r) => (
                      <CommandItem
                        key={r.id}
                        value={r.name}
                        onSelect={(val) => {
                          setSelectedRemesero(val);
                          setRemeseroOpen(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedRemesero === r.name ? "opacity-100" : "opacity-0")} />
                        {r.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Saldo inicial</Label>
            <p className="text-sm tabular-nums">{parsed.balanceInicialCup?.toLocaleString() ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Pagado</Label>
            <p className="text-sm tabular-nums">{parsed.pagadoCup.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Tirado</Label>
          <ul className="space-y-1 mt-1">
            {tirado.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <Input type="number" className="h-7 w-24 text-sm" value={t.usd} onChange={(e) => { const c = [...tirado]; c[i].usd = Number(e.target.value); setTirado(c); }} />
                <span className="text-muted-foreground self-center">×</span>
                <Input type="number" className="h-7 w-20 text-sm" value={t.tasa} onChange={(e) => { const c = [...tirado]; c[i].tasa = Number(e.target.value); setTirado(c); }} />
                <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => setTirado(tirado.filter((_, j) => j !== i))}>×</Button>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-1 text-xs" onClick={() => setTirado([...tirado, { usd: 0, tasa: 600 }])}>+ Tirada</Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Saldo final</Label>
            <p className="text-sm tabular-nums">{parsed.balanceFinalCup?.toLocaleString() ?? "—"}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <p className="text-sm capitalize">{parsed.balanceFinalLabel ?? "—"}</p>
          </div>
        </div>

        <Button className="w-full" onClick={submit} disabled={pending || !selectedRemesero}>
          {pending ? "Registrando..." : "Registrar cuadre"}
        </Button>
      </div>
    </div>
  );
}
