"use client";
import { useState, useTransition } from "react";
import { addRemeseroUsdMovement } from "@/server/actions/remesero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function UsdTab({ remeseros }: { remeseros: Array<{ id: number; name: string }> }) {
  const [selectedRemesero, setSelectedRemesero] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [remeseroOpen, setRemeseroOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountSign, setAmountSign] = useState<"+" | "-">("+");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const filtered = remeseros.filter((r) =>
    r.name.toLowerCase().includes(selectedRemesero.toLowerCase())
  );

  const submit = () => {
    if (!selectedId || !amount) return;
    const numericAmount = Number(amount);
    const signedAmount = amountSign === "-" ? -numericAmount : numericAmount;
    start(async () => {
      await addRemeseroUsdMovement({
        remeseroId: selectedId,
        date: new Date(),
        amount: signedAmount,
        note: note || undefined,
      });
      setAmount(""); setNote(""); setSelectedRemesero(""); setSelectedId(null);
    });
  };

  return (
    <div className="max-w-md space-y-4 rounded-xl border border-black/5 bg-card p-4">
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
                <CommandEmpty>No encontrado</CommandEmpty>
                <CommandGroup>
                  {filtered.map((r) => (
                    <CommandItem
                      key={r.id}
                      value={r.name}
                      onSelect={(val) => {
                        setSelectedRemesero(val);
                        setSelectedId(r.id);
                        setRemeseroOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedId === r.id ? "opacity-100" : "opacity-0")} />
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
        <Label className="text-xs text-muted-foreground">Tipo</Label>
        <div className="flex gap-2 mt-1">
          <Button
            size="sm"
            variant={amountSign === "+" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setAmountSign("+")}
          >
            Le debo (+)
          </Button>
          <Button
            size="sm"
            variant={amountSign === "-" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setAmountSign("-")}
          >
            Me debe / Pagué (−)
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Monto USD</Label>
        <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Nota</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: préstamo, devolución..." className="mt-1" />
      </div>

      <Button className="w-full" onClick={submit} disabled={pending || !selectedId || !amount}>
        {pending ? "Registrando..." : amountSign === "+" ? "Registrar deuda USD" : "Registrar pago / a favor"}
      </Button>
    </div>
  );
}
