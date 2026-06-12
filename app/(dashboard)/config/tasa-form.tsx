"use client";
import { useState } from "react";
import { updateTasaGlobal } from "@/server/actions/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TasaGlobalForm({ initialRate }: { initialRate: number }) {
  const [rate, setRate] = useState(initialRate);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await updateTasaGlobal(rate);
      }}
      className="flex items-end gap-2"
    >
      <div>
        <label className="text-sm">Tasa global (CUP / USD)</label>
        <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step="0.01" />
      </div>
      <Button type="submit">Guardar</Button>
    </form>
  );
}
