"use client";
import { useState, useTransition } from "react";
import { createWireAction, createZelleAccount } from "@/server/actions/wire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type Buyer = { id: number; name: string };
type Acct = { id: number; name: string; currency: string; bank: string | null; type: string };

function fmtNum(n: number) {
  return n > 0 ? n.toLocaleString("es-ES", { useGrouping: true }) : "";
}

export function WireForm({ accounts, buyers }: { accounts: Acct[]; buyers: Buyer[] }) {
  const [usdAmount, setUsdAmount] = useState("");
  const [tasa, setTasa] = useState("");
  const [moneda, setMoneda] = useState<"CUP" | "USD">("CUP");
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerQuery, setBuyerQuery] = useState("");
  const [newBuyerName, setNewBuyerName] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Acct | null>(null);
  const [newAccName, setNewAccName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagado, setPagado] = useState("");
  const [pending, start] = useTransition();

  const handleAmount = (raw: string, setter: (v: string) => void) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) { setter(""); return; }
    setter(Number(digits).toLocaleString("es-ES", { useGrouping: true }));
  };

  const usd = Number(usdAmount.replace(/\D/g, "")) || 0;
  const tasaNum = Number(tasa.replace(/\D/g, "")) || 0;
  const total = moneda === "CUP" ? usd * tasaNum : Math.round(usd * (1 + tasaNum / 100));
  const pagadoNum = Number(pagado.replace(/\D/g, "")) || 0;
  const pagadoEfectivo = pagadoNum > 0 ? pagadoNum : total;

  const filteredBuyers = buyers.filter((b) =>
    !buyerQuery || b.name.toLowerCase().includes(buyerQuery.toLowerCase())
  );

  const submit = () => {
    if (!buyerName || !usd || !tasaNum || !selectedAccount) return;
    start(async () => {
      const llc = selectedAccount;
      const destino = moneda === "CUP"
        ? accounts.find((a) => a.type === "efectivo_cup")
        : accounts.find((a) => a.type === "efectivo_usd");
      if (!llc || !destino) return alert("Cuenta no encontrada");
      await createWireAction({
        wireBuyerName: buyerName.trim(),
        date: new Date(),
        usdAmount: usd,
        tasa: tasaNum,
        monedaDestino: moneda,
        fromAccountId: llc.id,
        toAccountId: destino.id,
        pagado: pagadoEfectivo > 0 ? pagadoEfectivo : undefined,
      });
      setUsdAmount(""); setTasa(""); setBuyerName(""); setMoneda("CUP"); setSelectedAccount(null);
      setBuyerQuery(""); setPagado(""); setNewBuyerName("");
    });
  };

  const createBuyer = () => {
    const name = newBuyerName.trim();
    if (!name) return;
    setBuyerName(name);
    setNewBuyerName("");
  };

  const createAccount = async () => {
    if (!newAccName) return;
    start(async () => {
      const row = await createZelleAccount(newAccName);
      const newAcct: Acct = { id: row.id, name: newAccName, currency: "USD", bank: null, type: "llc_usa" };
      accounts.push(newAcct);
      setSelectedAccount(newAcct);
      setDialogOpen(false);
      setNewAccName("");
    });
  };

  return (
    <div className="max-w-md space-y-5">
      <div className="card-apple p-4 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase">USD</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="10,000"
            value={usdAmount}
            onChange={(e) => handleAmount(e.target.value, setUsdAmount)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Recibo en</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={moneda === "CUP" ? "default" : "outline"} className="flex-1" onClick={() => setMoneda("CUP")}>CUP</Button>
            <Button size="sm" variant={moneda === "USD" ? "default" : "outline"} className="flex-1" onClick={() => setMoneda("USD")}>USD</Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">{moneda === "CUP" ? "Tasa (CUP/USD)" : "% comisión"}</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={moneda === "CUP" ? "680" : "3"}
            value={tasa}
            onChange={(e) => handleAmount(e.target.value, setTasa)}
            className="mt-1"
          />
        </div>

        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase">{moneda === "CUP" ? "Total CUP" : "Total USD"}</span>
            <span className="text-lg font-semibold tabular-nums">{fmtNum(total)}</span>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Pagado (vacío = total)</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={fmtNum(total)}
            value={pagado}
            onChange={(e) => handleAmount(e.target.value, setPagado)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="card-apple p-4 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase">Comprador</Label>
          <Popover open={buyerOpen} onOpenChange={setBuyerOpen}>
            <PopoverTrigger
              render={<Button variant="outline" role="combobox" className="w-full justify-between mt-1 font-normal">
                {buyerName || "Buscar comprador..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>}
            />
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar comprador..." value={buyerQuery} onValueChange={setBuyerQuery} />
                <CommandList>
                  <CommandGroup>
                    {filteredBuyers.map((b) => (
                      <CommandItem key={b.id} value={b.name} onSelect={() => { setBuyerName(b.name); setBuyerOpen(false); setBuyerQuery(""); }}>
                        <Check className={cn("mr-2 h-4 w-4", buyerName === b.name ? "opacity-100" : "opacity-0")} />
                        {b.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="flex gap-1 mt-1.5">
            <Input
              placeholder="Nuevo comprador"
              value={newBuyerName}
              onChange={(e) => setNewBuyerName(e.target.value)}
              className="h-9 text-sm flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") createBuyer(); }}
            />
            <Button size="sm" className="h-9" onClick={createBuyer} disabled={!newBuyerName.trim()}>
              Crear
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Cuenta Zelle (origen)</Label>
          <div className="flex gap-2 mt-1">
            <Popover open={accountOpen} onOpenChange={setAccountOpen}>
              <PopoverTrigger
                render={<Button variant="outline" role="combobox" className="flex-1 justify-between font-normal">
                  {selectedAccount ? selectedAccount.name : "Elegir cuenta Zelle..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>}
              />
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cuenta..." />
                  <CommandList>
                    <CommandGroup>
                      {accounts.filter((a) => a.type === "llc_usa").map((a) => (
                        <CommandItem key={a.id} value={a.name} onSelect={() => { setSelectedAccount(a); setAccountOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", selectedAccount?.id === a.id ? "opacity-100" : "opacity-0")} />
                          {a.name} ({a.currency})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={<Button variant="outline" size="icon" title="Nueva cuenta">
                  <Wallet className="h-4 w-4" />
                </Button>}
              />
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva cuenta Zelle</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Nombre de la cuenta</Label>
                    <Input value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="Ej: LLC Wells Fargo" />
                  </div>
                  <Button className="w-full" onClick={createAccount} disabled={!newAccName}>Crear cuenta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={submit} disabled={pending || !buyerName || !usd || !tasaNum || !selectedAccount}>
        {pending ? "Registrando..." : "Registrar wire"}
      </Button>
    </div>
  );
}
