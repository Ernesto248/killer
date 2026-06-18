"use client";
import { useState, useEffect, useTransition } from "react";
import { parseCuadre, type ParsedCuadre } from "@/components/cuadre-parser/parser";
import { createCuadreAction } from "@/server/actions/cuadre";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : ""; }
function unfmt(s: string) { return Number(s.replace(/\D/g, "")) || 0; }

export function CuadreTab({ remeseros, initialRemesero }: { remeseros: Array<{ id: number; name: string }>; initialRemesero?: string }) {
  const [selectedRemesero, setSelectedRemesero] = useState(initialRemesero ?? "");
  const [remeseroOpen, setRemeseroOpen] = useState(false);
  const [finalRaw, setFinalRaw] = useState("");
  const [label, setLabel] = useState<"deuda" | "fondo">("deuda");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedCuadre | null>(null);
  const [tirado, setTirado] = useState<Array<{ usd: number; tasa: number }>>([]);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => { if (initialRemesero) setSelectedRemesero(initialRemesero); }, [initialRemesero]);

  const final = unfmt(finalRaw);

  const onTextChange = (v: string) => {
    setText(v);
    if (v.length > 20) {
      const p = parseCuadre(v);
      setParsed(p);
      setTirado(p.tirado);
      if (p.balanceFinalCup) setFinalRaw(fmt(p.balanceFinalCup));
      if (p.balanceFinalLabel) setLabel(p.balanceFinalLabel);
    }
  };

  const submit = () => {
    if (!selectedRemesero || finalRaw === "") return;
    start(async () => {
      await createCuadreAction({
        remeseroName: selectedRemesero,
        date: new Date(),
        pagadoCup: 0,
        balanceFinalCup: final,
        balanceFinalLabel: label,
        tirado: tirado.length > 0 ? tirado : undefined,
        rawText: text || "manual",
      });
      setSelectedRemesero(""); setFinalRaw(""); setText(""); setParsed(null); setTirado([]);
    });
  };

  const filtered = remeseros.filter((r) => r.name.toLowerCase().includes(selectedRemesero.toLowerCase()));

  return (
    <div className="max-w-md space-y-4">
      <div className="card-apple p-4 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase">Remesero</Label>
          <Popover open={remeseroOpen} onOpenChange={setRemeseroOpen}>
            <PopoverTrigger
              render={<Button variant="outline" role="combobox" className="w-full justify-between mt-1 font-normal">
                {selectedRemesero || "Seleccionar remesero..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>}
            />
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar remesero..." />
                <CommandList>
                  <CommandGroup>
                    {filtered.map((r) => (
                      <CommandItem key={r.id} value={r.name} onSelect={(val) => { setSelectedRemesero(val); setRemeseroOpen(false); }}>
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

          <div>
            <Label className="text-xs text-muted-foreground uppercase">Saldo final</Label>
            <Input type="text" inputMode="numeric" placeholder="0" value={finalRaw}
              onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setFinalRaw(d ? Number(d).toLocaleString("es-ES", { useGrouping: true }) : ""); }}
              className="mt-1" />
          </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Estado</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={label === "deuda" ? "default" : "outline"} className="flex-1" onClick={() => setLabel("deuda")}>Deuda</Button>
            <Button size="sm" variant={label === "fondo" ? "default" : "outline"} className="flex-1" onClick={() => setLabel("fondo")}>Fondo</Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowWhatsApp(!showWhatsApp)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {showWhatsApp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Pegar cuadre de WhatsApp (opcional)
        </button>

        {showWhatsApp && (
          <div>
            <Textarea rows={6} value={text} onChange={(e) => onTextChange(e.target.value)}
              placeholder="Pega aquí el cuadre del grupo de WhatsApp..." />
            {parsed && tirado.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Tirado detectado: {tirado.map((t, i) => <span key={i} className="mr-2">{fmt(t.usd)}×{t.tasa}</span>)}
              </div>
            )}
          </div>
        )}
      </div>

      <Button className="w-full" onClick={submit} disabled={pending || !selectedRemesero || finalRaw === ""}>
        {pending ? "Registrando..." : "Registrar cuadre"}
      </Button>
    </div>
  );
}
