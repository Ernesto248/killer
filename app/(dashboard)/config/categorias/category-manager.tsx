"use client";
import { useState } from "react";
import { createCategory, deactivateCategory } from "@/server/actions/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cat = { id: number; name: string; isActive: boolean };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-6">
      <form onSubmit={async (e) => { e.preventDefault(); await createCategory({ name }); setName(""); }} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría" required className="max-w-xs" />
        <Button type="submit">Crear</Button>
      </form>
      <ul className="space-y-1 max-w-md">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded border p-2">
            <span className={c.isActive ? "" : "text-muted-foreground line-through"}>{c.name}</span>
            {c.isActive && <Button size="sm" variant="ghost" onClick={() => deactivateCategory(c.id)}>Desactivar</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
