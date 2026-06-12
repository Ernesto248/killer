"use client";
import { useState } from "react";
import { createAccount, deactivateAccount } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: number; name: string; type: string; currency: string; isActive: boolean };

export function AccountManager({ accounts }: { accounts: Account[] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("efectivo_cup");
  const [currency, setCurrency] = useState("CUP");

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => { e.preventDefault(); await createAccount({ name, type: type as never, currency: currency as never }); setName(""); }}
        className="flex flex-wrap items-end gap-2"
      >
        <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required className="max-w-xs" />
        <Select value={type} onValueChange={(v) => setType(v ?? "")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="llc_usa">LLC USA</SelectItem>
            <SelectItem value="efectivo_cup">Efectivo CUP</SelectItem>
            <SelectItem value="efectivo_usd">Efectivo USD</SelectItem>
          </SelectContent>
        </Select>
        <Select value={currency} onValueChange={(v) => setCurrency(v ?? "")}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="CUP">CUP</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">Crear</Button>
      </form>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left"><th className="p-2">Nombre</th><th className="p-2">Tipo</th><th className="p-2">Moneda</th><th className="p-2">Activa</th><th className="p-2"></th></tr></thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="p-2">{a.name}</td><td className="p-2">{a.type}</td><td className="p-2">{a.currency}</td>
              <td className="p-2">{a.isActive ? "Sí" : "No"}</td>
              <td className="p-2">{a.isActive && <Button variant="ghost" size="sm" onClick={() => deactivateAccount(a.id)}>Desactivar</Button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
