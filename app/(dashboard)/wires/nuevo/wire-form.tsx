"use client";
import { useState, useTransition } from "react";
import { createWireAction, createAccountAction } from "@/server/actions/wire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, ChevronsUpDown, Wallet, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type Buyer = { id: number; name: string };
type Acct = { id: number; name: string; currency: string; bank: string | null; type: string };

function fmt(n: number) { return n > 0 ? n.toLocaleString("es-ES") : ""; }
function unfmt(s: string) { return Number(s.replace(/[.,\s]/g, "")) || 0; }

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
  const [newAccCurrency, setNewAccCurrency] = useState("CUP");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagado, setPagado] = useState("");
  const [pending, start] = useTransition();

  const usd = unfmt(usdAmount);
  const tasaNum = unfmt(tasa);
  const total = moneda === "CUP" ? usd * tasaNum : usd * (1 + tasaNum / 100);
  const pagadoNum = unfmt(pagado);
  const pagadoEfectivo = pagadoNum > 0 ? pagadoNum : total;

  const filteredBuyers = buyers.filter((b) =>
    !buyerQuery || b.name.toLowerCase().includes(buyerQuery.toLowerCase())
  );

  const submit = () => {
    if (!buyerName || !usd || !tasaNum || !selectedAccount) return;
    start(async () => {
      const llc = accounts.find((a) => a.type === "llc_usa");
      if (!llc) return alert("Cuenta LLC USA no encontrada");
      await createWireAction({
        wireBuyerName: buyerName.trim(),
        date: new Date(),
        usdAmount: usd,
        tasa: tasaNum,
        monedaDestino: moneda,
        fromAccountId: llc.id,
        toAccountId: selectedAccount.id,
        pagado: pagadoEfectivo > 0 ? pagadoEfectivo : undefined,
      });
      setUsdAmount(""); setTasa(""); setBuyerName(""); setMoneda("CUP"); setSelectedAccount(null);
      setBuyerQuery(""); setPagado(""); setNewBuyerName("");
    });
  };

  const createAccount = async () => {
    if (!newAccName) return;
    const row = await createAccountAction({ name: newAccName, currency: newAccCurrency });
    const newAcct: Acct = { id: row.id, name: newAccName, currency: newAccCurrency, bank: null, type: newAccCurrency === "USD" ? "efectivo_usd" : "efectivo_cup" };
    accounts.push(newAcct);
    setSelectedAccount(newAcct);
    setDialogOpen(false);
    setNewAccName("");
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
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d.,]/g, "");
              setUsdAmount(raw);
            }}
            onBlur={() => { if (usd) setUsdAmount(fmt(usd)); }}
            onFocus={() => { if (usd) setUsdAmount(String(usd)); }}
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
            onChange={(e) => setTasa(e.target.value.replace(/[^\d.,]/g, ""))}
            className="mt-1"
          />
        </div>

        <div className="rounded-lg bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase">{moneda === "CUP" ? "Total CUP" : "Total USD"}</span>
            <span className="text-lg font-semibold tabular-nums">{fmt(total)}</span>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Pagado (dejar vacío = total)</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={fmt(total)}
            value={pagado}
            onChange={(e) => setPagado(e.target.value.replace(/[^\d.,]/g, ""))}
            onBlur={() => { const n = unfmt(pagado); if (n) setPagado(fmt(n)); }}
            onFocus={() => { const n = unfmt(pagado); if (n) setPagado(String(n)); }}
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
                {buyerName || "Buscar o crear comprador..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>}
            />
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar..." value={buyerQuery} onValueChange={setBuyerQuery} />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">No encontrado</p>
                      <div className="flex gap-1">
                        <Input
                          placeholder="Nombre del comprador"
                          value={newBuyerName}
                          onChange={(e) => setNewBuyerName(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newBuyerName.trim()) {
                              setBuyerName(newBuyerName.trim());
                              setBuyerOpen(false);
                              setBuyerQuery("");
                              setNewBuyerName("");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            if (newBuyerName.trim()) {
                              setBuyerName(newBuyerName.trim());
                              setBuyerOpen(false);
                              setBuyerQuery("");
                              setNewBuyerName("");
                            }
                          }}
                        >
                          Crear
                        </Button>
                      </div>
                    </div>
                  </CommandEmpty>
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
        </div>

        <div>
          <Label className="text-xs text-muted-foreground uppercase">Cuenta destino</Label>
          <div className="flex gap-2 mt-1">
            <Popover open={accountOpen} onOpenChange={setAccountOpen}>
              <PopoverTrigger
                render={<Button variant="outline" role="combobox" className="flex-1 justify-between font-normal">
                  {selectedAccount ? `${selectedAccount.name} (${selectedAccount.currency})` : "Elegir cuenta..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>}
              />
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar cuenta..." />
                  <CommandList>
                    <CommandGroup>
                      {accounts.filter((a) => a.type !== "llc_usa").map((a) => (
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
                <DialogHeader><DialogTitle>Nueva cuenta</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="Ej: USD Físico 2" />
                  </div>
                  <div>
                    <Label className="text-xs">Moneda</Label>
                    <div className="flex gap-2 mt-1">
                      <Button size="sm" variant={newAccCurrency === "CUP" ? "default" : "outline"} onClick={() => setNewAccCurrency("CUP")}>CUP</Button>
                      <Button size="sm" variant={newAccCurrency === "USD" ? "default" : "outline"} onClick={() => setNewAccCurrency("USD")}>USD</Button>
                    </div>
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
