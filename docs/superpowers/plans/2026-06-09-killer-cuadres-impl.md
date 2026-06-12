# Sistema de Gestión de Remesas y Divisas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 15 web app for José to manage remittances, wire sales, USD cash flow, operational expenses, and counterparty debts, replacing his WhatsApp + Excel workflow.

**Architecture:** Next.js 15 App Router with Server Actions for mutations, Drizzle ORM on PostgreSQL (Neon — único entorno), UI composed of `getdesign apple` template + `shadcn/ui` for data-dense components. Validación con scripts `tsx` (Vitest pendiente de resolver instalación). Frequent commits per task.

**Tech Stack:** Next.js 15, TypeScript (strict), Drizzle ORM, PostgreSQL/Neon, Tailwind CSS, shadcn/ui, getdesign apple, React Hook Form, Zod, tsx, Biome.

---

## File Structure

```
/app                              # Next.js App Router
  /(dashboard)
    /layout.tsx                   # Shell con header + sidebar
    /page.tsx                     # Dashboard
    /cuadres
      /nuevo/page.tsx
      /page.tsx
    /wires
      /nuevo/page.tsx
      /page.tsx
      /[id]/page.tsx
    /remeseros
      /page.tsx
      /[id]/page.tsx
    /wire-buyers
      /page.tsx
      /[id]/page.tsx
    /tesoreria
      /movimiento/page.tsx
    /gastos
      /nuevo/page.tsx
      /page.tsx
    /alertas/page.tsx
    /config
      /page.tsx
      /cuentas/page.tsx
      /categorias/page.tsx
  /api
    /cron/snapshot/route.ts
  /layout.tsx
  /globals.css
/components
  /ui                             # shadcn primitives
  /layout
    /app-shell.tsx
    /header.tsx
    /sidebar.tsx
  /forms
  /cuadre-parser
    /parser.ts
    /parser.test.ts
  /charts
    /capital-evolution.tsx
/lib
  /db
    /index.ts
    /schema.ts
  /domain
    /cuadre.ts
    /wire.ts
    /wire.test.ts
    /remesero.ts
    /exchange.ts
    /expense.ts
    /snapshot.ts
  /validators
    /account.ts
    /category.ts
    /config.ts
  /utils.ts
/server
  /actions
    /cuadre.ts
    /wire.ts
    /remesero.ts
    /exchange.ts
    /expense.ts
    /alert.ts
    /config.ts
    /category.ts
    /account.ts
/drizzle.config.ts
/scripts
  /import-excel.ts
/tests
  /setup.ts
/infra
  /docker-compose.yml      # NO USADO (Neon es el único entorno)
  /.env.example
```

---

## Phase 0 — Setup

### Task 0.1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Create Next.js app**

Run: `pnpm dlx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-pnpm`
Expected: project created.

- [ ] **Step 2: Verify dev server starts**

Run: `pnpm dev`
Expected: app on http://localhost:3000.

- [ ] **Step 3: Commit**

```bash
git init
git add -A
git commit -m "chore: initialize Next.js 15 with TypeScript and Tailwind"
```

### Task 0.2: Add Biome (sin Vitest/Playwright por ahora)

**Files:**
- Create: `biome.json`

**Nota**: Vitest y Playwright se omiten por bloqueo de instalación. Tests se reemplazan por scripts `tsx` ejecutables con asserts. Cuando se resuelva el bloqueo, agregar Vitest como fase 9.

- [ ] **Step 1: Install Biome**

```bash
pnpm add -w -D @biomejs/biome
```

- [ ] **Step 2: Init Biome config**

Create `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } }
}
```

- [ ] **Step 3: Add scripts**

Edit `package.json` scripts (merge, don't replace):
```json
{
  "scripts": {
    "lint": "biome check .",
    "format": "biome format --write ."
  }
}
```

- [ ] **Step 4: Verify**

Run: `pnpm lint`
Expected: no errors or only minor warnings.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Biome"
```

### Task 0.3: Configurar DATABASE_URL apuntando a Neon

**Files:**
- Create: `infra/.env.example`, `.env.local`, update `.gitignore`

- [ ] **Step 1: Create env files**

Create `infra/.env.example`:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

Create `.env.local` (con la URL real de Neon — pedirla al usuario):
```
DATABASE_URL=<pedir al usuario>
```

Add to `.gitignore`:
```
.env
.env.local
```

- [ ] **Step 2: Commit**

```bash
git add infra/.env.example .gitignore
git commit -m "chore: env files template for Neon"
```

### Task 0.4: Drizzle ORM setup

- [ ] **Step 1: Install**

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit tsx
```

- [ ] **Step 2: Create drizzle.config.ts**

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 3: Create db client**

Create `lib/db/index.ts`:
```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connection = postgres(process.env.DATABASE_URL!, { max: 1 });
export const db = drizzle(connection, { schema });
```

Create `lib/db/schema.ts` (placeholder):
```ts
// populated in Phase 1+
```

- [ ] **Step 4: Add db scripts to package.json**

```json
{ "scripts": { "db:generate": "drizzle-kit generate", "db:migrate": "drizzle-kit migrate", "db:push": "drizzle-kit push", "db:studio": "drizzle-kit studio", "db:seed": "tsx lib/db/seed.ts" } }
```

- [ ] **Step 5: Verify and commit**

```bash
pnpm db:push
git add -A
git commit -m "chore: setup Drizzle ORM"
```

### Task 0.5: shadcn/ui

- [ ] **Step 1: Initialize**

```bash
pnpm dlx shadcn@latest init -d
```

- [ ] **Step 2: Add components**

```bash
pnpm dlx shadcn@latest add button input label card dialog form select textarea table tabs badge alert dropdown-menu command calendar popover
```

- [ ] **Step 3: Add DataTable**

```bash
pnpm add @tanstack/react-table
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: setup shadcn/ui"
```

### Task 0.6: Try getdesign and create app shell

- [ ] **Step 1: Try the template**

```bash
pnpm dlx getdesign@latest add apple
```
Note which components are useful.

- [ ] **Step 2: Create sidebar**

Create `components/layout/sidebar.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/cuadres", label: "Cuadres" },
  { href: "/wires", label: "Wires" },
  { href: "/remeseros", label: "Remeseros" },
  { href: "/wire-buyers", label: "Wire Buyers" },
  { href: "/tesoreria/movimiento", label: "Tesorería" },
  { href: "/gastos", label: "Gastos" },
  { href: "/alertas", label: "Alertas" },
  { href: "/config", label: "Config" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-card p-4">
      <nav className="space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn("block rounded px-3 py-2 text-sm hover:bg-accent", pathname === it.href && "bg-accent font-medium")}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create header**

Create `components/layout/header.tsx`:
```tsx
import { Bell } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <h1 className="text-lg font-semibold">Killer — Cuadres</h1>
      <Link href="/alertas" className="relative">
        <Bell className="h-5 w-5" />
      </Link>
    </header>
  );
}
```

- [ ] **Step 4: Create app shell**

Create `components/layout/app-shell.tsx`:
```tsx
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Wire layout**

Create `app/(dashboard)/layout.tsx`:
```tsx
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

Create `app/(dashboard)/page.tsx`:
```tsx
export default function Dashboard() {
  return <div>Dashboard</div>;
}
```

- [ ] **Step 6: Verify and commit**

```bash
pnpm dev
git add -A
git commit -m "feat(shell): app layout with sidebar and header"
```

---

## Phase 1 — Cuentas y catálogo

### Task 1.1: Schema for account, category, config

- [ ] **Step 1: Add entities to `lib/db/schema.ts`**

Replace `lib/db/schema.ts`:
```ts
import { pgTable, serial, text, timestamp, boolean, jsonb, numeric } from "drizzle-orm/pg-core";

export const account = pgTable("account", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  currency: text("currency").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Push and verify**

```bash
pnpm db:push
psql $env:DATABASE_URL -c "\dt"   # o en PowerShell: $env:DATABASE_URL = (Get-Content .env.local -Raw).Trim()
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): schema for account, category, config"
```

### Task 1.2: Seed script

- [ ] **Step 1: Create seed file**

Create `lib/db/seed.ts`:
```ts
import { db } from "./index";
import { account, category, config } from "./schema";

async function seed() {
  console.log("Seeding...");
  await db.delete(category);
  await db.delete(account);
  await db.delete(config);

  await db.insert(account).values([
    { name: "LLC USA", type: "llc_usa", currency: "USD" },
    { name: "CUP Físico", type: "efectivo_cup", currency: "CUP" },
    { name: "USD Físico", type: "efectivo_usd", currency: "USD" },
  ]);

  await db.insert(category).values([
    { name: "Gasolina" },
    { name: "Transporte" },
    { name: "Salarios" },
    { name: "Comida" },
    { name: "Servicios" },
    { name: "Otros" },
  ]);

  await db.insert(config).values({ key: "tasa_global", value: { rate: 530 } });
  console.log("Seeded.");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run**

```bash
pnpm db:seed
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): seed accounts, categories, config"
```

### Task 1.3: Account CRUD with TDD

- [ ] **Step 1: Validator test**

Create `lib/validators/account.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { accountInputSchema } from "./account";

describe("accountInputSchema", () => {
  it("validates a USD LLC account", () => {
    const result = accountInputSchema.parse({ name: "LLC USA", type: "llc_usa", currency: "USD" });
    expect(result.name).toBe("LLC USA");
  });
  it("rejects invalid type", () => {
    expect(() => accountInputSchema.parse({ name: "x", type: "invalid", currency: "USD" })).toThrow();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test lib/validators/account.test.ts
```

- [ ] **Step 3: Validator**

Create `lib/validators/account.ts`:
```ts
import { z } from "zod";

export const accountInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["llc_usa", "efectivo_cup", "efectivo_usd"]),
  currency: z.enum(["USD", "CUP"]),
});

export type AccountInput = z.infer<typeof accountInputSchema>;
```

- [ ] **Step 4: Run (passes)**

```bash
pnpm test lib/validators/account.test.ts
```

- [ ] **Step 5: Server actions**

Create `server/actions/account.ts`:
```ts
"use server";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { accountInputSchema, type AccountInput } from "@/lib/validators/account";

export async function createAccount(input: AccountInput) {
  const parsed = accountInputSchema.parse(input);
  const [row] = await db.insert(account).values(parsed).returning();
  revalidatePath("/config/cuentas");
  return row;
}

export async function updateAccount(id: number, input: AccountInput) {
  const parsed = accountInputSchema.parse(input);
  const [row] = await db.update(account).set(parsed).where(eq(account.id, id)).returning();
  revalidatePath("/config/cuentas");
  return row;
}

export async function deactivateAccount(id: number) {
  await db.update(account).set({ isActive: false }).where(eq(account.id, id));
  revalidatePath("/config/cuentas");
}
```

- [ ] **Step 6: Page + manager component**

Create `app/(dashboard)/config/cuentas/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { AccountManager } from "./account-manager";

export default async function CuentasPage() {
  const accounts = await db.select().from(account);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Cuentas</h2>
      <AccountManager accounts={accounts} />
    </div>
  );
}
```

Create `app/(dashboard)/config/cuentas/account-manager.tsx`:
```tsx
"use client";
import { useState } from "react";
import { createAccount, deactivateAccount } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: number; name: string; type: string; currency: string; isActive: boolean };

export function AccountManager({ accounts }: { accounts: Account[] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("llc_usa");
  const [currency, setCurrency] = useState("USD");

  return (
    <div className="space-y-6">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await createAccount({ name, type: type as never, currency: currency as never });
          setName("");
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="llc_usa">LLC USA</SelectItem>
            <SelectItem value="efectivo_cup">Efectivo CUP</SelectItem>
            <SelectItem value="efectivo_usd">Efectivo USD</SelectItem>
          </SelectContent>
        </Select>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="CUP">CUP</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">Crear</Button>
      </form>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Moneda</th>
            <th className="p-2">Activa</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="p-2">{a.name}</td>
              <td className="p-2">{a.type}</td>
              <td className="p-2">{a.currency}</td>
              <td className="p-2">{a.isActive ? "Sí" : "No"}</td>
              <td className="p-2">
                {a.isActive && <Button variant="ghost" size="sm" onClick={() => deactivateAccount(a.id)}>Desactivar</Button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 7: Manual test and commit**

```bash
pnpm db:reset && pnpm db:seed && pnpm dev
git add -A
git commit -m "feat(config): account CRUD UI"
```

### Task 1.4: Category CRUD

- [ ] **Step 1: Validator and test**

Create `lib/validators/category.ts`:
```ts
import { z } from "zod";
export const categoryInputSchema = z.object({ name: z.string().min(1).max(60) });
export type CategoryInput = z.infer<typeof categoryInputSchema>;
```

Create `lib/validators/category.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { categoryInputSchema } from "./category";

describe("categoryInputSchema", () => {
  it("accepts a name", () => {
    expect(categoryInputSchema.parse({ name: "Gasolina" })).toEqual({ name: "Gasolina" });
  });
  it("rejects empty", () => {
    expect(() => categoryInputSchema.parse({ name: "" })).toThrow();
  });
});
```

- [ ] **Step 2: Run (passes)**

```bash
pnpm test lib/validators/category.test.ts
```

- [ ] **Step 3: Server actions**

Create `server/actions/category.ts`:
```ts
"use server";
import { db } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { categoryInputSchema } from "@/lib/validators/category";

export async function createCategory(input: { name: string }) {
  const parsed = categoryInputSchema.parse(input);
  const [row] = await db.insert(category).values(parsed).returning();
  revalidatePath("/config/categorias");
  return row;
}

export async function deactivateCategory(id: number) {
  await db.update(category).set({ isActive: false }).where(eq(category.id, id));
  revalidatePath("/config/categorias");
}
```

- [ ] **Step 4: Page + manager**

Create `app/(dashboard)/config/categorias/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { CategoryManager } from "./category-manager";

export default async function CategoriasPage() {
  const cats = await db.select().from(category);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Categorías</h2>
      <CategoryManager categories={cats} />
    </div>
  );
}
```

Create `app/(dashboard)/config/categorias/category-manager.tsx`:
```tsx
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
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await createCategory({ name });
          setName("");
        }}
        className="flex gap-2"
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría" required />
        <Button type="submit">Crear</Button>
      </form>
      <ul className="space-y-1">
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
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(config): category CRUD"
```

### Task 1.5: Tasa global config

- [ ] **Step 1: Validator and test**

Create `lib/validators/config.ts`:
```ts
import { z } from "zod";
export const tasaGlobalSchema = z.object({ rate: z.number().positive() });
```

Create `lib/validators/config.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { tasaGlobalSchema } from "./config";

describe("tasaGlobalSchema", () => {
  it("accepts positive rate", () => {
    expect(tasaGlobalSchema.parse({ rate: 530 })).toEqual({ rate: 530 });
  });
  it("rejects zero", () => {
    expect(() => tasaGlobalSchema.parse({ rate: 0 })).toThrow();
  });
});
```

- [ ] **Step 2: Action**

Create `server/actions/config.ts`:
```ts
"use server";
import { db } from "@/lib/db";
import { config } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { tasaGlobalSchema } from "@/lib/validators/config";

export async function updateTasaGlobal(rate: number) {
  const parsed = tasaGlobalSchema.parse({ rate });
  await db.update(config).set({ value: parsed, updatedAt: new Date() }).where(eq(config.key, "tasa_global"));
  revalidatePath("/config");
}
```

- [ ] **Step 3: Page + form**

Create `app/(dashboard)/config/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { config } from "@/lib/db/schema";
import { TasaGlobalForm } from "./tasa-form";
import Link from "next/link";
import { eq } from "drizzle-orm";

export default async function ConfigPage() {
  const [tasa] = await db.select().from(config).where(eq(config.key, "tasa_global"));
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Configuración</h2>
      <TasaGlobalForm initialRate={(tasa?.value as { rate: number })?.rate ?? 0} />
      <ul className="space-y-2">
        <li><Link href="/config/cuentas" className="underline">Cuentas</Link></li>
        <li><Link href="/config/categorias" className="underline">Categorías</Link></li>
      </ul>
    </div>
  );
}
```

Create `app/(dashboard)/config/tasa-form.tsx`:
```tsx
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
        <label className="text-sm">Tasa global (CUP × USD)</label>
        <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step="0.01" />
      </div>
      <Button type="submit">Guardar</Button>
    </form>
  );
}
```

- [ ] **Step 4: Manual test and commit**

```bash
git add -A
git commit -m "feat(config): tasa global"
```

---

## Phase 2 — Remeseros y Cuadres

### Task 2.1: Schema for remesero, cuadre, tirada, balance, USD movement

- [ ] **Step 1: Append entities to `lib/db/schema.ts`**

```ts
import { index, integer } from "drizzle-orm/pg-core";

export const remesero = pgTable("remesero", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("remesero_name_idx").on(t.name),
}));

export const cuadre = pgTable("cuadre", {
  id: serial("id").primaryKey(),
  remeseroId: integer("remesero_id").notNull().references(() => remesero.id),
  date: timestamp("date").notNull(),
  balanceInicialCup: numeric("balance_inicial_cup", { precision: 18, scale: 2 }).notNull(),
  pagadoCup: numeric("pagado_cup", { precision: 18, scale: 2 }).notNull().default("0"),
  pendientesUsd: numeric("pendientes_usd", { precision: 18, scale: 2 }).notNull().default("0"),
  pendientesTasa: numeric("pendientes_tasa", { precision: 8, scale: 2 }),
  tiradoItems: jsonb("tirado_items").$type<Array<{ usd: string; tasa: string }>>().notNull().default([]),
  balanceFinalCup: numeric("balance_final_cup", { precision: 18, scale: 2 }).notNull(),
  balanceFinalLabel: text("balance_final_label").notNull(),
  rawText: text("raw_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  remeseroDateIdx: index("cuadre_remesero_date_idx").on(t.remeseroId, t.date),
}));

export const cuadreTirada = pgTable("cuadre_tirada", {
  id: serial("id").primaryKey(),
  cuadreId: integer("cuadre_id").notNull().references(() => cuadre.id, { onDelete: "cascade" }),
  remeseroId: integer("remesero_id").notNull().references(() => remesero.id),
  date: timestamp("date").notNull(),
  usd: numeric("usd", { precision: 18, scale: 2 }).notNull(),
  tasa: numeric("tasa", { precision: 8, scale: 2 }).notNull(),
  cupEquivalente: numeric("cup_equivalente", { precision: 18, scale: 2 }).notNull(),
  consumedByWireId: integer("consumed_by_wire_id"),
  consumedAt: timestamp("consumed_at"),
}, (t) => ({
  fifoIdx: index("tirada_fifo_idx").on(t.consumedByWireId, t.date),
}));

export const remeseroBalance = pgTable("remesero_balance", {
  remeseroId: integer("remesero_id").primaryKey().references(() => remesero.id),
  balanceCup: numeric("balance_cup", { precision: 18, scale: 2 }).notNull().default("0"),
  balanceUsd: numeric("balance_usd", { precision: 18, scale: 2 }).notNull().default("0"),
  lastCuadreAt: timestamp("last_cuadre_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const remeseroUsdMovement = pgTable("remesero_usd_movement", {
  id: serial("id").primaryKey(),
  remeseroId: integer("remesero_id").notNull().references(() => remesero.id),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Push and commit**

```bash
pnpm db:push
git add -A
git commit -m "feat(db): remesero, cuadre, cuadre_tirada, remesero_balance, remesero_usd_movement"
```

### Task 2.2: WhatsApp cuadre parser with TDD

- [ ] **Step 1: Write tests for the 3 sample cuadres from the spec**

Create `components/cuadre-parser/parser.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseCuadre } from "./parser";

const sample1 = `🚩 🅸🅽🅸🅲🅸🅞 📖
       *$* *2.827.560* \`deuda\`

🪎 🅟🅐🅖🅐🅳🅞
       \`$ 5,000,000\`

📌 🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂
       0 × 0

🇺🇲 🆃🅸🆁🅐🅳🅞 🇲🇽
      3756 × 573
         223 × 585
       2970 × 587
         330 × 595

🚩 🅵🅸🅽🅐🅛 📕
       *$* *2.049.943* \`deuda\`

@Naidiel Zll`;

const sample2 = `🚩 🅸🅽🅸🅲🅸🅞 📖
       *$* *101.793* \`deuda\`

🪎 🅟🅐🅖🅐🅳🅞
       \`$ 1,620,000\`

📌 🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂
       0 × 0

🇺🇲 🆃🅸🆁🅐🅳🅾 🇲🇽
         150 × 573
       2229 × 575

🚩 🅵🅸🅽🅐🅛 📕
       *$* *150.582* \`fondo\`

@Yohan 2 Remesero`;

const sample3 = `🚩 🅸🅽🅸🅲🅸🅞 📖
       *$* *408.172* \`deuda\`

🪎 🅟🅐🅶🅐🅳🅞
       \`$ 860,000\`
       \`$ 1,120,000\`

📌 🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂
       0 × 575

🇺🇲 🆃🅸🆁🅐🅳🅞 🇲🇽
         720 × 575
         350 × 540
         786 × 585
           30 × 590
      1949 × 595
       3145 × 600

🚩 🅵🅸🅽🅐🅛 📕
       *$* *2.555.337* \`deuda\`

@Gea Zll`;

describe("parseCuadre", () => {
  it("parses sample 1 (deuda, single pago, 4 tiradas)", () => {
    const r = parseCuadre(sample1);
    expect(r.remesero).toBe("Naidiel Zll");
    expect(r.balanceInicialCup).toBe(2827560);
    expect(r.pagadoCup).toBe(5000000);
    expect(r.pendientes).toEqual({ usd: 0, tasa: 0 });
    expect(r.tirado).toEqual([
      { usd: 3756, tasa: 573 },
      { usd: 223, tasa: 585 },
      { usd: 2970, tasa: 587 },
      { usd: 330, tasa: 595 },
    ]);
    expect(r.balanceFinalCup).toBe(2049943);
    expect(r.balanceFinalLabel).toBe("deuda");
  });

  it("parses sample 2 (fondo, single pago, 2 tiradas)", () => {
    const r = parseCuadre(sample2);
    expect(r.remesero).toBe("Yohan 2 Remesero");
    expect(r.balanceInicialCup).toBe(101793);
    expect(r.pagadoCup).toBe(1620000);
    expect(r.tirado).toEqual([
      { usd: 150, tasa: 573 },
      { usd: 2229, tasa: 575 },
    ]);
    expect(r.balanceFinalCup).toBe(150582);
    expect(r.balanceFinalLabel).toBe("fondo");
  });

  it("parses sample 3 (multiple pagos, 6 tiradas, deuda)", () => {
    const r = parseCuadre(sample3);
    expect(r.remesero).toBe("Gea Zll");
    expect(r.balanceInicialCup).toBe(408172);
    expect(r.pagadoCup).toBe(860000 + 1120000);
    expect(r.tirado).toHaveLength(6);
    expect(r.balanceFinalCup).toBe(2555337);
    expect(r.balanceFinalLabel).toBe("deuda");
  });

  it("handles formatted numbers with dots as thousands separator", () => {
    const text = `🅸🅽🅸🅲🅸🅞 📖\n*$* *1.234.567* \`deuda\`\n🅵🅸🅽🅐🅛 📕\n*$* *500* \`deuda\`\n@Test`;
    expect(parseCuadre(text).balanceInicialCup).toBe(1234567);
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test components/cuadre-parser/parser.test.ts
```

- [ ] **Step 3: Implement parser**

Create `components/cuadre-parser/parser.ts`:
```ts
export type ParsedCuadre = {
  remesero: string | null;
  balanceInicialCup: number | null;
  pagadoCup: number;
  pendientes: { usd: number; tasa: number };
  tirado: Array<{ usd: number; tasa: number }>;
  balanceFinalCup: number | null;
  balanceFinalLabel: "deuda" | "fondo" | null;
};

function parseAmount(raw: string): number {
  return Number(raw.replace(/[$.*\s`]/g, "").replace(/,/g, "")) || 0;
}

function findSection(text: string, marker: string, untilMarker: string): string {
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const after = text.slice(start + marker.length);
  const end = after.indexOf(untilMarker);
  return end < 0 ? after : after.slice(0, end);
}

export function parseCuadre(text: string): ParsedCuadre {
  const tiradoSection = findSection(text, "🆃🅸🆁🅐🅳🅞", "🚩 🅵🅸🅽🅐");
  const inicialSection = findSection(text, "🅸🅽🅸🅲🅸🅞 📖", "🪎");
  const pagadoSection = findSection(text, "🅟🅐🅖🅐🅳🅞", "📌");
  const pendientesSection = findSection(text, "🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂", "🇺🇲");
  const finalSection = findSection(text, "🅵🅸🅽🅐🅛 📕", "@");

  const inicialMatch = inicialSection.match(/([\d.,]+)\s*`?(deuda|fondo)`?/i);
  const finalMatch = finalSection.match(/([\d.,]+)\s*`?(deuda|fondo)`?/i);

  const pagadoAmounts = [...pagadoSection.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseAmount(m[1]));
  const pagadoCup = pagadoAmounts.reduce((a, b) => a + b, 0);

  const pendientesMatch = pendientesSection.match(/([\d.,]+)\s*×\s*([\d.,]+)/);
  const pendientes = pendientesMatch
    ? { usd: parseAmount(pendientesMatch[1]), tasa: parseAmount(pendientesMatch[2]) }
    : { usd: 0, tasa: 0 };

  const tiradoItems = [...tiradoSection.matchAll(/([\d.,]+)\s*×\s*([\d.,]+)/g)].map((m) => ({
    usd: parseAmount(m[1]),
    tasa: parseAmount(m[2]),
  }));

  const remeseroMatch = text.match(/@([^\n`]+?)(?:\s*```|$)/);
  const remesero = remeseroMatch ? remeseroMatch[1].trim() : null;

  return {
    remesero,
    balanceInicialCup: inicialMatch ? parseAmount(inicialMatch[1]) : null,
    pagadoCup,
    pendientes,
    tirado: tiradoItems,
    balanceFinalCup: finalMatch ? parseAmount(finalMatch[1]) : null,
    balanceFinalLabel: finalMatch ? (finalMatch[2].toLowerCase() as "deuda" | "fondo") : null,
  };
}
```

- [ ] **Step 4: Run (passes)**

```bash
pnpm test components/cuadre-parser/parser.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(cuadre-parser): WhatsApp parser with tests"
```

### Task 2.3: registrarCuadre domain function

- [ ] **Step 1: Create domain function**

Create `lib/domain/cuadre.ts`:
```ts
import { db } from "@/lib/db";
import { cuadre, cuadreTirada, remesero, remeseroBalance, account, accountMovement } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type CuadreInput = {
  remeseroName: string;
  date: Date;
  balanceInicialCup: number;
  pagadoCup: number;
  pendientes: { usd: number; tasa: number };
  tirado: Array<{ usd: number; tasa: number }>;
  balanceFinalCup: number;
  balanceFinalLabel: "deuda" | "fondo";
  rawText: string;
};

export async function registrarCuadre(input: CuadreInput) {
  return db.transaction(async (tx) => {
    let [r] = await tx.select().from(remesero).where(eq(remesero.name, input.remeseroName));
    if (!r) {
      [r] = await tx.insert(remesero).values({ name: input.remeseroName }).returning();
    }

    const [cupAccount] = await tx.select().from(account).where(eq(account.type, "efectivo_cup"));
    if (!cupAccount) throw new Error("CUP Físico account not found");

    const [c] = await tx.insert(cuadre).values({
      remeseroId: r.id,
      date: input.date,
      balanceInicialCup: String(input.balanceInicialCup),
      pagadoCup: String(input.pagadoCup),
      pendientesUsd: String(input.pendientes.usd),
      pendientesTasa: input.pendientes.tasa ? String(input.pendientes.tasa) : null,
      tiradoItems: input.tirado.map((t) => ({ usd: String(t.usd), tasa: String(t.tasa) })),
      balanceFinalCup: String(input.balanceFinalCup),
      balanceFinalLabel: input.balanceFinalLabel,
      rawText: input.rawText,
    }).returning();

    if (input.tirado.length > 0) {
      await tx.insert(cuadreTirada).values(
        input.tirado.map((t) => ({
          cuadreId: c.id,
          remeseroId: r.id,
          date: input.date,
          usd: String(t.usd),
          tasa: String(t.tasa),
          cupEquivalente: String(t.usd * t.tasa),
        }))
      );
    }

    await tx.insert(remeseroBalance).values({
      remeseroId: r.id,
      balanceCup: String(input.balanceFinalCup),
      lastCuadreAt: input.date,
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: { balanceCup: String(input.balanceFinalCup), lastCuadreAt: input.date, updatedAt: new Date() },
    });

    if (input.pagadoCup > 0) {
      await tx.insert(accountMovement).values({
        accountId: cupAccount.id,
        date: input.date,
        amount: String(-input.pagadoCup),
        currency: "CUP",
        refType: "cuadre",
        refId: c.id,
        note: `Pago a ${input.remeseroName}`,
      });
    }

    return { cuadreId: c.id, remeseroId: r.id };
  });
}
```

- [ ] **Step 2: Server action**

Create `server/actions/cuadre.ts`:
```ts
"use server";
import { registrarCuadre } from "@/lib/domain/cuadre";
import { revalidatePath } from "next/cache";

export async function createCuadreAction(input: Parameters<typeof registrarCuadre>[0]) {
  const result = await registrarCuadre(input);
  revalidatePath("/remeseros");
  revalidatePath("/");
  return result;
}
```

- [ ] **Step 3: Manual test with script**

Create `scripts/test-registrar-cuadre.ts`:
```ts
import { registrarCuadre } from "../lib/domain/cuadre";

async function main() {
  const result = await registrarCuadre({
    remeseroName: "Test Remesero",
    date: new Date(),
    balanceInicialCup: 100000,
    pagadoCup: 50000,
    pendientes: { usd: 0, tasa: 0 },
    tirado: [{ usd: 200, tasa: 575 }],
    balanceFinalCup: 165000,
    balanceFinalLabel: "deuda",
    rawText: "test",
  });
  console.log(result);
  process.exit(0);
}
main();
```

Run: `pnpm tsx scripts/test-registrar-cuadre.ts`
Expected: `{ cuadreId: 1, remeseroId: 1 }`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(cuadre): registrarCuadre domain function"
```

### Task 2.4: Pegar cuadre UI

- [ ] **Step 1: Page and form**

Create `app/(dashboard)/cuadres/nuevo/page.tsx`:
```tsx
import { CuadreForm } from "./cuadre-form";

export default function NuevoCuadrePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Pegar cuadre</h2>
      <CuadreForm />
    </div>
  );
}
```

Create `app/(dashboard)/cuadres/nuevo/cuadre-form.tsx`:
```tsx
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
```

- [ ] **Step 2: Manual test and commit**

```bash
pnpm dev
git add -A
git commit -m "feat(cuadres): paste-and-parse UI"
```

### Task 2.5: Remeseros list and ficha

- [ ] **Step 1: List page**

Create `app/(dashboard)/remeseros/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { remesero, remeseroBalance } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function RemeserosPage() {
  const rows = await db
    .select({
      id: remesero.id, name: remesero.name,
      balanceCup: remeseroBalance.balanceCup, balanceUsd: remeseroBalance.balanceUsd,
      lastCuadreAt: remeseroBalance.lastCuadreAt,
    })
    .from(remesero)
    .leftJoin(remeseroBalance, eq(remeseroBalance.remeseroId, remesero.id))
    .orderBy(desc(remeseroBalance.lastCuadreAt));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Remeseros</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left text-sm">
            <th className="p-2">Nombre</th>
            <th className="p-2 text-right">Balance CUP</th>
            <th className="p-2 text-right">Balance USD</th>
            <th className="p-2">Último cuadre</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b hover:bg-accent">
              <td className="p-2"><Link href={`/remeseros/${r.id}`} className="underline">{r.name}</Link></td>
              <td className="p-2 text-right tabular-nums">{Number(r.balanceCup ?? 0).toLocaleString()}</td>
              <td className="p-2 text-right tabular-nums">{Number(r.balanceUsd ?? 0).toLocaleString()}</td>
              <td className="p-2 text-sm text-muted-foreground">{r.lastCuadreAt?.toLocaleDateString() ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Ficha page**

Create `app/(dashboard)/remeseros/[id]/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { remesero, cuadre, remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { UsdMovementForm } from "./usd-movement-form";

export default async function RemeseroFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const remeseroId = Number(id);
  const [r] = await db.select().from(remesero).where(eq(remesero.id, remeseroId));
  if (!r) notFound();
  const [balance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, remeseroId));
  const cuadres = await db.select().from(cuadre).where(eq(cuadre.remeseroId, remeseroId)).orderBy(desc(cuadre.date)).limit(50);
  const usdMovs = await db.select().from(remeseroUsdMovement).where(eq(remeseroUsdMovement.remeseroId, remeseroId)).orderBy(desc(remeseroUsdMovement.date)).limit(50);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{r.name}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border p-3">
          <div className="text-sm text-muted-foreground">Balance CUP</div>
          <div className="text-2xl tabular-nums">{Number(balance?.balanceCup ?? 0).toLocaleString()}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-muted-foreground">Balance USD</div>
          <div className="text-2xl tabular-nums">{Number(balance?.balanceUsd ?? 0).toLocaleString()}</div>
        </div>
      </div>
      <UsdMovementForm remeseroId={remeseroId} />
      <section>
        <h3 className="text-lg font-semibold">Historial de cuadres</h3>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">Fecha</th>
              <th className="p-2 text-right">Inicial</th>
              <th className="p-2 text-right">Pagado</th>
              <th className="p-2 text-right">Final</th>
              <th className="p-2">Label</th>
            </tr>
          </thead>
          <tbody>
            {cuadres.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{c.date.toLocaleDateString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(c.balanceInicialCup).toLocaleString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(c.pagadoCup).toLocaleString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(c.balanceFinalCup).toLocaleString()}</td>
                <td className="p-2">{c.balanceFinalLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="text-lg font-semibold">Movimientos USD</h3>
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">Monto</th><th className="p-2">Nota</th></tr></thead>
          <tbody>
            {usdMovs.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">{m.date.toLocaleDateString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(m.amount).toLocaleString()}</td>
                <td className="p-2">{m.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: USD movement form + action**

Create `server/actions/remesero.ts`:
```ts
"use server";
import { db } from "@/lib/db";
import { remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  remeseroId: z.number().int(),
  date: z.date(),
  amount: z.number(),
  note: z.string().optional(),
});

export async function addRemeseroUsdMovement(input: z.infer<typeof schema>) {
  const parsed = schema.parse(input);
  await db.transaction(async (tx) => {
    await tx.insert(remeseroUsdMovement).values({
      remeseroId: parsed.remeseroId,
      date: parsed.date,
      amount: String(parsed.amount),
      note: parsed.note,
    });
    await tx.insert(remeseroBalance).values({
      remeseroId: parsed.remeseroId,
      balanceUsd: String(parsed.amount),
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: { balanceUsd: sql`${remeseroBalance.balanceUsd} + ${parsed.amount}`, updatedAt: new Date() },
    });
  });
  revalidatePath(`/remeseros/${parsed.remeseroId}`);
}
```

Create `app/(dashboard)/remeseros/[id]/usd-movement-form.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { addRemeseroUsdMovement } from "@/server/actions/remesero";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UsdMovementForm({ remeseroId }: { remeseroId: number }) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await addRemeseroUsdMovement({ remeseroId, date: new Date(), amount, note });
          setAmount(0); setNote("");
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded border p-3"
    >
      <div>
        <label className="text-sm">Monto USD</label>
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm">Nota</label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "..." : "Registrar"}</Button>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(remeseros): list, ficha, USD movements"
```

### Task 2.6: Cuadres list page

- [ ] **Step 1: List page**

Create `app/(dashboard)/cuadres/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { cuadre, remesero } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function CuadresPage() {
  const rows = await db
    .select({
      id: cuadre.id, date: cuadre.date, remeseroName: remesero.name,
      inicial: cuadre.balanceInicialCup, pagado: cuadre.pagadoCup,
      final: cuadre.balanceFinalCup, label: cuadre.balanceFinalLabel,
    })
    .from(cuadre)
    .leftJoin(remesero, eq(remesero.id, cuadre.remeseroId))
    .orderBy(desc(cuadre.date))
    .limit(100);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Cuadres</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Fecha</th><th className="p-2">Remesero</th>
            <th className="p-2 text-right">Inicial</th>
            <th className="p-2 text-right">Pagado</th>
            <th className="p-2 text-right">Final</th><th className="p-2">Label</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.date?.toLocaleDateString()}</td>
              <td className="p-2">{r.remeseroName}</td>
              <td className="p-2 text-right tabular-nums">{Number(r.inicial).toLocaleString()}</td>
              <td className="p-2 text-right tabular-nums">{Number(r.pagado).toLocaleString()}</td>
              <td className="p-2 text-right tabular-nums">{Number(r.final).toLocaleString()}</td>
              <td className="p-2">{r.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(cuadres): list page"
```

---

## Phase 3 — Wire buyers y Wires con FIFO

### Task 3.1: Schema for wire_buyer, wire, wire_split, wire_payment, wire_buyer_balance

- [ ] **Step 1: Append entities to `lib/db/schema.ts`**

```ts
export const wireBuyer = pgTable("wire_buyer", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("wire_buyer_name_idx").on(t.name),
}));

export const wire = pgTable("wire", {
  id: serial("id").primaryKey(),
  wireBuyerId: integer("wire_buyer_id").notNull().references(() => wireBuyer.id),
  date: timestamp("date").notNull(),
  usdAmount: numeric("usd_amount", { precision: 18, scale: 2 }).notNull(),
  tasaCup: numeric("tasa_cup", { precision: 8, scale: 2 }).notNull(),
  cupTotal: numeric("cup_total", { precision: 18, scale: 2 }).notNull(),
  gananciaEstimadaCup: numeric("ganancia_estimada_cup", { precision: 18, scale: 2 }),
  nota: text("nota"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wireSplit = pgTable("wire_split", {
  id: serial("id").primaryKey(),
  wireId: integer("wire_id").notNull().references(() => wire.id, { onDelete: "cascade" }),
  destinoAccountId: integer("destino_account_id").notNull().references(() => account.id),
  usdAmount: numeric("usd_amount", { precision: 18, scale: 2 }).notNull(),
  tasaDestino: numeric("tasa_destino", { precision: 8, scale: 2 }).notNull(),
  cupRecibido: numeric("cup_recibido", { precision: 18, scale: 2 }).notNull(),
});

export const wirePayment = pgTable("wire_payment", {
  id: serial("id").primaryKey(),
  wireId: integer("wire_id").notNull().references(() => wire.id),
  wireBuyerId: integer("wire_buyer_id").notNull().references(() => wireBuyer.id),
  date: timestamp("date").notNull(),
  cupAmount: numeric("cup_amount", { precision: 18, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  wireIdx: index("wire_payment_wire_idx").on(t.wireId),
  buyerIdx: index("wire_payment_buyer_idx").on(t.wireBuyerId),
}));

export const wireBuyerBalance = pgTable("wire_buyer_balance", {
  wireBuyerId: integer("wire_buyer_id").primaryKey().references(() => wireBuyer.id),
  balanceCup: numeric("balance_cup", { precision: 18, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Push and commit**

```bash
pnpm db:push
git add -A
git commit -m "feat(db): wire_buyer, wire, wire_split, wire_payment, wire_buyer_balance"
```

### Task 3.2: FIFO consumption with TDD

- [ ] **Step 1: Test**

Create `lib/domain/wire.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeFifoConsumption } from "./wire";

describe("computeFifoConsumption", () => {
  it("consumes from oldest first", () => {
    const tiradas = [
      { id: 1, usd: 100, tasa: 600, date: new Date("2026-01-01") },
      { id: 2, usd: 200, tasa: 610, date: new Date("2026-01-02") },
      { id: 3, usd: 500, tasa: 620, date: new Date("2026-01-03") },
    ];
    const r = computeFifoConsumption(tiradas, 250);
    expect(r.consumed).toEqual([
      { id: 1, usd: 100, tasa: 600 },
      { id: 2, usd: 150, tasa: 610 },
    ]);
    expect(r.totalCup).toBe(100 * 600 + 150 * 610);
    expect(r.tasaPromedio).toBeCloseTo((100 * 600 + 150 * 610) / 250);
  });

  it("consumes multiple full tiradas", () => {
    const tiradas = [
      { id: 1, usd: 100, tasa: 600, date: new Date("2026-01-01") },
      { id: 2, usd: 100, tasa: 610, date: new Date("2026-01-02") },
    ];
    const r = computeFifoConsumption(tiradas, 150);
    expect(r.consumed).toEqual([{ id: 1, usd: 100, tasa: 600 }, { id: 2, usd: 50, tasa: 610 }]);
  });

  it("throws when not enough USD", () => {
    const tiradas = [{ id: 1, usd: 50, tasa: 600, date: new Date() }];
    expect(() => computeFifoConsumption(tiradas, 100)).toThrow();
  });
});
```

- [ ] **Step 2: Run (fails)**

```bash
pnpm test lib/domain/wire.test.ts
```

- [ ] **Step 3: Implement**

Create `lib/domain/wire.ts`:
```ts
import { db } from "@/lib/db";
import { cuadreTirada, wire, wireSplit, wireBuyer, wireBuyerBalance, account, accountMovement } from "@/lib/db/schema";
import { eq, isNull, asc, sql } from "drizzle-orm";

export type TiradaForFifo = { id: number; usd: number; tasa: number; date: Date };

export type FifoResult = {
  consumed: Array<{ id: number; usd: number; tasa: number }>;
  remainingTirada: { id: number; usd: number; tasa: number; splitFrom: number } | null;
  totalCup: number;
  tasaPromedio: number;
};

export function computeFifoConsumption(tiradas: TiradaForFifo[], targetUsd: number): FifoResult {
  let remaining = targetUsd;
  let totalCup = 0;
  const consumed: FifoResult["consumed"] = [];
  let remainingTirada: FifoResult["remainingTirada"] = null;

  for (const t of tiradas) {
    if (remaining <= 0) break;
    const usar = Math.min(t.usd, remaining);
    consumed.push({ id: t.id, usd: usar, tasa: t.tasa });
    totalCup += usar * t.tasa;
    remaining -= usar;
    if (usar < t.usd) {
      remainingTirada = { id: t.id, usd: t.usd - usar, tasa: t.tasa, splitFrom: t.id };
    }
  }

  if (remaining > 0) {
    throw new Error("No hay suficientes USD disponibles en tiradas para cubrir el wire");
  }

  return { consumed, remainingTirada, totalCup, tasaPromedio: totalCup / targetUsd };
}

export type WireSplitInput = { destinoAccountId: number; usdAmount: number; tasaDestino: number };
export type CreateWireInput = {
  wireBuyerName: string;
  date: Date;
  usdAmount: number;
  tasaCup: number;
  splits: WireSplitInput[];
  nota?: string;
};

export async function createWire(input: CreateWireInput) {
  const totalSplitUsd = input.splits.reduce((a, s) => a + s.usdAmount, 0);
  if (Math.abs(totalSplitUsd - input.usdAmount) > 0.01) {
    throw new Error(`Split USD (${totalSplitUsd}) no coincide con usdAmount (${input.usdAmount})`);
  }

  return db.transaction(async (tx) => {
    let [wb] = await tx.select().from(wireBuyer).where(eq(wireBuyer.name, input.wireBuyerName));
    if (!wb) {
      [wb] = await tx.insert(wireBuyer).values({ name: input.wireBuyerName }).returning();
    }

    const [llcAccount] = await tx.select().from(account).where(eq(account.type, "llc_usa"));
    if (!llcAccount) throw new Error("LLC USA account not found");

    const tiradas = await tx
      .select()
      .from(cuadreTirada)
      .where(isNull(cuadreTirada.consumedByWireId))
      .orderBy(asc(cuadreTirada.date), asc(cuadreTirada.id))
      .for("update");

    const tiradasForFifo = tiradas.map((t) => ({ id: t.id, usd: Number(t.usd), tasa: Number(t.tasa), date: t.date }));
    const fifo = computeFifoConsumption(tiradasForFifo, input.usdAmount);

    let ganancia = 0;
    for (const split of input.splits) {
      ganancia += split.usdAmount * (split.tasaDestino - fifo.tasaPromedio);
    }

    const cupTotal = input.usdAmount * input.tasaCup;
    const [w] = await tx.insert(wire).values({
      wireBuyerId: wb.id,
      date: input.date,
      usdAmount: String(input.usdAmount),
      tasaCup: String(input.tasaCup),
      cupTotal: String(cupTotal),
      gananciaEstimadaCup: String(ganancia),
      nota: input.nota,
    }).returning();

    for (const s of input.splits) {
      await tx.insert(wireSplit).values({
        wireId: w.id,
        destinoAccountId: s.destinoAccountId,
        usdAmount: String(s.usdAmount),
        tasaDestino: String(s.tasaDestino),
        cupRecibido: String(s.usdAmount * s.tasaDestino),
      });
    }

    for (const c of fifo.consumed) {
      const original = tiradas.find((t) => t.id === c.id)!;
      if (c.usd === original.usd) {
        await tx.update(cuadreTirada).set({ consumedByWireId: w.id, consumedAt: new Date() }).where(eq(cuadreTirada.id, c.id));
      } else {
        await tx.update(cuadreTirada).set({ consumedByWireId: w.id, consumedAt: new Date() }).where(eq(cuadreTirada.id, c.id));
        const rest = original.usd - c.usd;
        await tx.insert(cuadreTirada).values({
          cuadreId: original.cuadreId,
          remeseroId: original.remeseroId,
          date: original.date,
          usd: String(rest),
          tasa: original.tasa,
          cupEquivalente: String(rest * Number(original.tasa)),
        });
      }
    }

    await tx.insert(accountMovement).values({
      accountId: llcAccount.id,
      date: input.date,
      amount: String(-input.usdAmount),
      currency: "USD",
      refType: "wire",
      refId: w.id,
    });
    for (const s of input.splits) {
      const dest = (await tx.select().from(account).where(eq(account.id, s.destinoAccountId)))[0];
      const amount = dest.currency === "USD" ? s.usdAmount : s.usdAmount * s.tasaDestino;
      await tx.insert(accountMovement).values({
        accountId: dest.id,
        date: input.date,
        amount: String(amount),
        currency: dest.currency,
        refType: "wire_split",
        refId: w.id,
        note: `Wire #${w.id}`,
      });
    }

    await tx.insert(wireBuyerBalance).values({
      wireBuyerId: wb.id,
      balanceCup: String(cupTotal),
    }).onConflictDoUpdate({
      target: wireBuyerBalance.wireBuyerId,
      set: { balanceCup: sql`${wireBuyerBalance.balanceCup} + ${cupTotal}`, updatedAt: new Date() },
    });

    return { wireId: w.id, ganancia, cupTotal };
  });
}
```

- [ ] **Step 4: Run (passes)**

```bash
pnpm test lib/domain/wire.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(wire): FIFO consumption logic with tests"
```

### Task 3.3: Wire creation UI

- [ ] **Step 1: Server action**

Create `server/actions/wire.ts`:
```ts
"use server";
import { createWire } from "@/lib/domain/wire";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { wire, wirePayment, wireBuyerBalance, account, accountMovement } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function createWireAction(input: Parameters<typeof createWire>[0]) {
  const result = await createWire(input);
  revalidatePath("/wires");
  revalidatePath("/wire-buyers");
  return result;
}

export async function addWirePaymentAction(input: { wireId: number; wireBuyerId: number; date: Date; cupAmount: number; note?: string }) {
  await db.transaction(async (tx) => {
    await tx.insert(wirePayment).values({
      wireId: input.wireId,
      wireBuyerId: input.wireBuyerId,
      date: input.date,
      cupAmount: String(input.cupAmount),
      note: input.note,
    });
    await tx.update(wireBuyerBalance)
      .set({ balanceCup: sql`${wireBuyerBalance.balanceCup} - ${input.cupAmount}`, updatedAt: new Date() })
      .where(eq(wireBuyerBalance.wireBuyerId, input.wireBuyerId));
    const [cupAccount] = await tx.select().from(account).where(eq(account.type, "efectivo_cup"));
    if (cupAccount) {
      await tx.insert(accountMovement).values({
        accountId: cupAccount.id,
        date: input.date,
        amount: String(input.cupAmount),
        currency: "CUP",
        refType: "wire_payment",
        refId: input.wireId,
      });
    }
  });
  revalidatePath(`/wires/${input.wireId}`);
  revalidatePath(`/wire-buyers/${input.wireBuyerId}`);
}
```

- [ ] **Step 2: Page + form**

Create `app/(dashboard)/wires/nuevo/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { WireForm } from "./wire-form";

export default async function NuevoWirePage() {
  const accounts = await db.select().from(account);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Nuevo wire</h2>
      <WireForm accounts={accounts} />
    </div>
  );
}
```

Create `app/(dashboard)/wires/nuevo/wire-form.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { createWireAction } from "@/server/actions/wire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: number; name: string; currency: string };
type Split = { destinoAccountId: number; usdAmount: number; tasaDestino: number };

export function WireForm({ accounts }: { accounts: Account[] }) {
  const [buyerName, setBuyerName] = useState("");
  const [usdAmount, setUsdAmount] = useState(0);
  const [tasaCup, setTasaCup] = useState(530);
  const [splits, setSplits] = useState<Split[]>([]);
  const [pending, start] = useTransition();

  const addSplit = () => setSplits([...splits, { destinoAccountId: accounts[0]?.id ?? 0, usdAmount: 0, tasaDestino: 660 }]);
  const totalSplitUsd = splits.reduce((a, s) => a + s.usdAmount, 0);
  const valid = buyerName && Math.abs(totalSplitUsd - usdAmount) < 0.01 && splits.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 max-w-2xl">
        <div><label className="text-sm">Wire buyer</label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} /></div>
        <div><label className="text-sm">Tasa referencia</label><Input type="number" value={tasaCup} onChange={(e) => setTasaCup(Number(e.target.value))} /></div>
        <div><label className="text-sm">USD total</label><Input type="number" value={usdAmount} onChange={(e) => setUsdAmount(Number(e.target.value))} /></div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Split a cuentas físicas</h3>
        {splits.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Select value={String(s.destinoAccountId)} onValueChange={(v) => { const c = [...splits]; c[i].destinoAccountId = Number(v); setSplits(c); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" placeholder="USD" value={s.usdAmount} onChange={(e) => { const c = [...splits]; c[i].usdAmount = Number(e.target.value); setSplits(c); }} className="w-32" />
            <Input type="number" placeholder="Tasa" value={s.tasaDestino} onChange={(e) => { const c = [...splits]; c[i].tasaDestino = Number(e.target.value); setSplits(c); }} className="w-32" />
            <Button variant="ghost" size="sm" onClick={() => setSplits(splits.filter((_, j) => j !== i))}>×</Button>
          </div>
        ))}
        <Button variant="outline" onClick={addSplit}>+ Añadir split</Button>
      </div>
      <div className="text-sm">
        Total split USD: <strong className="tabular-nums">{totalSplitUsd.toLocaleString()}</strong> / {usdAmount.toLocaleString()}
        {Math.abs(totalSplitUsd - usdAmount) > 0.01 && <span className="ml-2 text-red-500">(no coincide)</span>}
      </div>
      <Button disabled={!valid || pending} onClick={() => {
        start(async () => {
          await createWireAction({ wireBuyerName: buyerName, date: new Date(), usdAmount, tasaCup, splits });
        });
      }}>{pending ? "..." : "Registrar wire"}</Button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(wire): wire creation form with split"
```

### Task 3.4: Wire buyers list and ficha

- [ ] **Step 1: List page**

Create `app/(dashboard)/wire-buyers/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { wireBuyer, wireBuyerBalance } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function WireBuyersPage() {
  const rows = await db
    .select({ id: wireBuyer.id, name: wireBuyer.name, balance: wireBuyerBalance.balanceCup })
    .from(wireBuyer)
    .leftJoin(wireBuyerBalance, eq(wireBuyerBalance.wireBuyerId, wireBuyer.id));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Wire buyers</h2>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left"><th className="p-2">Nombre</th><th className="p-2 text-right">Deuda CUP</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b hover:bg-accent">
              <td className="p-2"><Link href={`/wire-buyers/${r.id}`} className="underline">{r.name}</Link></td>
              <td className="p-2 text-right tabular-nums">{Number(r.balance ?? 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Ficha page**

Create `app/(dashboard)/wire-buyers/[id]/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { wireBuyer, wireBuyerBalance, wire, wirePayment } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function WireBuyerFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buyerId = Number(id);
  const [wb] = await db.select().from(wireBuyer).where(eq(wireBuyer.id, buyerId));
  if (!wb) notFound();
  const [balance] = await db.select().from(wireBuyerBalance).where(eq(wireBuyerBalance.wireBuyerId, buyerId));
  const wires = await db.select().from(wire).where(eq(wire.wireBuyerId, buyerId)).orderBy(desc(wire.date));
  const payments = await db.select().from(wirePayment).where(eq(wirePayment.wireBuyerId, buyerId)).orderBy(desc(wirePayment.date));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{wb.name}</h2>
      <div className="rounded border p-3">
        <div className="text-sm text-muted-foreground">Deuda</div>
        <div className="text-2xl tabular-nums">{Number(balance?.balanceCup ?? 0).toLocaleString()} CUP</div>
      </div>
      <section>
        <h3 className="text-lg font-semibold">Wires vendidos</h3>
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">USD</th><th className="p-2 text-right">CUP</th><th className="p-2 text-right">Ganancia est.</th></tr></thead>
          <tbody>
            {wires.map((w) => (
              <tr key={w.id} className="border-b">
                <td className="p-2">{w.date.toLocaleDateString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(w.usdAmount).toLocaleString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(w.cupTotal).toLocaleString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(w.gananciaEstimadaCup ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3 className="text-lg font-semibold">Pagos recibidos</h3>
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">CUP</th><th className="p-2">Nota</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.date.toLocaleDateString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(p.cupAmount).toLocaleString()}</td>
                <td className="p-2">{p.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(wire-buyers): list and ficha"
```

### Task 3.5: Wire ficha with payment form

- [ ] **Step 1: Wire ficha page**

Create `app/(dashboard)/wires/[id]/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { wire, wireSplit, wirePayment, wireBuyer } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";

export default async function WireFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wireId = Number(id);
  const [w] = await db.select().from(wire).where(eq(wire.id, wireId));
  if (!w) notFound();
  const [wb] = await db.select().from(wireBuyer).where(eq(wireBuyer.id, w.wireBuyerId));
  const splits = await db.select().from(wireSplit).where(eq(wireSplit.wireId, wireId));
  const payments = await db.select().from(wirePayment).where(eq(wirePayment.wireId, wireId));
  const totalPagado = payments.reduce((a, p) => a + Number(p.cupAmount), 0);
  const cupTotal = Number(w.cupTotal);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Wire #{w.id} — {wb?.name}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">USD</div><div className="text-2xl tabular-nums">{Number(w.usdAmount).toLocaleString()}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">CUP total</div><div className="text-2xl tabular-nums">{cupTotal.toLocaleString()}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Pagado</div><div className="text-2xl tabular-nums">{totalPagado.toLocaleString()}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Pendiente</div><div className="text-2xl tabular-nums">{(cupTotal - totalPagado).toLocaleString()}</div></div>
      </div>
      <PaymentForm wireId={w.id} wireBuyerId={w.wireBuyerId} />
      <section>
        <h3 className="text-lg font-semibold">Splits</h3>
        <ul className="text-sm space-y-1">
          {splits.map((s) => <li key={s.id}>{Number(s.usdAmount).toLocaleString()} USD × {s.tasaDestino} = {Number(s.cupRecibido).toLocaleString()} CUP</li>)}
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-semibold">Pagos</h3>
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">CUP</th><th className="p-2">Nota</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.date.toLocaleDateString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(p.cupAmount).toLocaleString()}</td>
                <td className="p-2">{p.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

Create `app/(dashboard)/wires/[id]/payment-form.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { addWirePaymentAction } from "@/server/actions/wire";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PaymentForm({ wireId, wireBuyerId }: { wireId: number; wireBuyerId: number }) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await addWirePaymentAction({ wireId, wireBuyerId, date: new Date(), cupAmount: amount, note });
          setAmount(0); setNote("");
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded border p-3"
    >
      <div><label className="text-sm">Pago CUP</label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
      <div className="flex-1 min-w-[200px]"><label className="text-sm">Nota</label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <Button type="submit" disabled={pending || amount <= 0}>{pending ? "..." : "Registrar pago"}</Button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(wire): wire ficha with payment form"
```

---

## Phase 4 — Tesorería

### Task 4.1: Currency exchange

- [ ] **Step 1: Add schema**

Append to `lib/db/schema.ts`:
```ts
export const currencyExchange = pgTable("currency_exchange", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  direction: text("direction").notNull(),
  usdAmount: numeric("usd_amount", { precision: 18, scale: 2 }).notNull(),
  tasa: numeric("tasa", { precision: 8, scale: 2 }).notNull(),
  cupAmount: numeric("cup_amount", { precision: 18, scale: 2 }).notNull(),
  fromAccountId: integer("from_account_id").notNull().references(() => account.id),
  toAccountId: integer("to_account_id").notNull().references(() => account.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Domain + action + page**

Create `lib/domain/exchange.ts`:
```ts
import { db } from "@/lib/db";
import { currencyExchange, account, accountMovement } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type ExchangeInput = {
  date: Date;
  direction: "compra_usd" | "venta_usd";
  usdAmount: number;
  tasa: number;
  fromAccountId: number;
  toAccountId: number;
  note?: string;
};

export async function createExchange(input: ExchangeInput) {
  const cupAmount = input.usdAmount * input.tasa;
  return db.transaction(async (tx) => {
    const [from] = await tx.select().from(account).where(eq(account.id, input.fromAccountId));
    const [to] = await tx.select().from(account).where(eq(account.id, input.toAccountId));

    const [e] = await tx.insert(currencyExchange).values({
      date: input.date,
      direction: input.direction,
      usdAmount: String(input.usdAmount),
      tasa: String(input.tasa),
      cupAmount: String(cupAmount),
      fromAccountId: from.id,
      toAccountId: to.id,
      note: input.note,
    }).returning();

    await tx.insert(accountMovement).values({
      accountId: from.id,
      date: input.date,
      amount: String(-(from.currency === "USD" ? input.usdAmount : cupAmount)),
      currency: from.currency,
      refType: "exchange",
      refId: e.id,
    });
    await tx.insert(accountMovement).values({
      accountId: to.id,
      date: input.date,
      amount: String(to.currency === "USD" ? input.usdAmount : cupAmount),
      currency: to.currency,
      refType: "exchange",
      refId: e.id,
    });

    return e;
  });
}
```

Create `server/actions/exchange.ts`:
```ts
"use server";
import { createExchange } from "@/lib/domain/exchange";
import { revalidatePath } from "next/cache";
export async function createExchangeAction(input: Parameters<typeof createExchange>[0]) {
  const r = await createExchange(input);
  revalidatePath("/tesoreria/movimiento");
  return r;
}
```

Create `app/(dashboard)/tesoreria/movimiento/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { ExchangeForm } from "./exchange-form";

export default async function MovimientoPage() {
  const accounts = await db.select().from(account);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Compra / Venta USD físico</h2>
      <ExchangeForm accounts={accounts} />
    </div>
  );
}
```

Create `app/(dashboard)/tesoreria/movimiento/exchange-form.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { createExchangeAction } from "@/server/actions/exchange";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: number; name: string; currency: string };

export function ExchangeForm({ accounts }: { accounts: Account[] }) {
  const [direction, setDirection] = useState<"compra_usd" | "venta_usd">("compra_usd");
  const [usdAmount, setUsdAmount] = useState(0);
  const [tasa, setTasa] = useState(530);
  const [from, setFrom] = useState(accounts[0]?.id ?? 0);
  const [to, setTo] = useState(accounts[1]?.id ?? 0);
  const [pending, start] = useTransition();

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        await createExchangeAction({ date: new Date(), direction, usdAmount, tasa, fromAccountId: from, toAccountId: to });
        setUsdAmount(0);
      });
    }} className="space-y-3 max-w-md">
      <Select value={direction} onValueChange={(v) => setDirection(v as never)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="compra_usd">Comprar USD (pago en CUP)</SelectItem>
          <SelectItem value="venta_usd">Vender USD (recibo CUP)</SelectItem>
        </SelectContent>
      </Select>
      <div><label className="text-sm">USD</label><Input type="number" value={usdAmount} onChange={(e) => setUsdAmount(Number(e.target.value))} /></div>
      <div><label className="text-sm">Tasa</label><Input type="number" value={tasa} onChange={(e) => setTasa(Number(e.target.value))} /></div>
      <div><label className="text-sm">CUP equivalente (auto)</label><Input disabled value={usdAmount * tasa} /></div>
      <div>
        <label className="text-sm">Cuenta origen</label>
        <Select value={String(from)} onValueChange={(v) => setFrom(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm">Cuenta destino</label>
        <Select value={String(to)} onValueChange={(v) => setTo(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending || usdAmount <= 0}>{pending ? "..." : "Registrar"}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Push, manual test, commit**

```bash
pnpm db:push
pnpm dev
git add -A
git commit -m "feat(tesoreria): compra/venta USD fisico"
```

---

## Phase 5 — Gastos

### Task 5.1: Expense schema + CRUD

- [ ] **Step 1: Add schema**

Append to `lib/db/schema.ts`:
```ts
export const operationalExpense = pgTable("operational_expense", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  categoryId: integer("category_id").notNull().references(() => category.id),
  description: text("description").notNull(),
  cupAmount: numeric("cup_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  usdAmount: numeric("usd_amount", { precision: 18, scale: 2 }).notNull().default("0"),
  fromAccountId: integer("from_account_id").references(() => account.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Domain + actions + pages**

Create `lib/domain/expense.ts`:
```ts
import { db } from "@/lib/db";
import { operationalExpense, account, accountMovement } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const expenseInputSchema = z.object({
  date: z.date(),
  categoryId: z.number().int(),
  description: z.string().min(1),
  cupAmount: z.number().min(0).default(0),
  usdAmount: z.number().min(0).default(0),
  fromAccountId: z.number().int().nullable().optional(),
  note: z.string().optional(),
}).refine((d) => (d.cupAmount > 0) !== (d.usdAmount > 0), { message: "Debe tener un solo monto positivo (CUP o USD)" });

export async function createExpense(input: z.infer<typeof expenseInputSchema>) {
  const parsed = expenseInputSchema.parse(input);
  return db.transaction(async (tx) => {
    const [e] = await tx.insert(operationalExpense).values({
      date: parsed.date,
      categoryId: parsed.categoryId,
      description: parsed.description,
      cupAmount: String(parsed.cupAmount),
      usdAmount: String(parsed.usdAmount),
      fromAccountId: parsed.fromAccountId ?? null,
      note: parsed.note,
    }).returning();

    if (parsed.cupAmount > 0 || parsed.usdAmount > 0) {
      const [from] = await tx.select().from(account).where(eq(account.id, parsed.fromAccountId!));
      if (from) {
        await tx.insert(accountMovement).values({
          accountId: from.id,
          date: parsed.date,
          amount: String(-(parsed.cupAmount > 0 ? parsed.cupAmount : parsed.usdAmount)),
          currency: from.currency,
          refType: "expense",
          refId: e.id,
          note: parsed.description,
        });
      }
    }
    return e;
  });
}
```

Create `server/actions/expense.ts`:
```ts
"use server";
import { createExpense } from "@/lib/domain/expense";
import { revalidatePath } from "next/cache";
export async function createExpenseAction(input: Parameters<typeof createExpense>[0]) {
  const r = await createExpense(input);
  revalidatePath("/gastos");
  return r;
}
```

Create `app/(dashboard)/gastos/nuevo/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { category, account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GastoForm } from "./gasto-form";

export default async function NuevoGastoPage() {
  const [cats, accts] = await Promise.all([
    db.select().from(category).where(eq(category.isActive, true)),
    db.select().from(account),
  ]);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Nuevo gasto</h2>
      <GastoForm categories={cats} accounts={accts} />
    </div>
  );
}
```

Create `app/(dashboard)/gastos/nuevo/gasto-form.tsx`:
```tsx
"use client";
import { useState, useTransition } from "react";
import { createExpenseAction } from "@/server/actions/expense";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GastoForm({ categories, accounts }: { categories: { id: number; name: string }[]; accounts: { id: number; name: string; currency: string }[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState<"CUP" | "USD">("CUP");
  const [amount, setAmount] = useState(0);
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id ?? 0);
  const [pending, start] = useTransition();

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      start(async () => {
        await createExpenseAction({
          date: new Date(), categoryId, description,
          cupAmount: currency === "CUP" ? amount : 0,
          usdAmount: currency === "USD" ? amount : 0,
          fromAccountId,
        });
        setAmount(0); setDescription("");
      });
    }} className="space-y-3 max-w-md">
      <div>
        <label className="text-sm">Categoría</label>
        <Select value={String(categoryId)} onValueChange={(v) => setCategoryId(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm">Descripción</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm">Moneda</label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as never)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm">Monto</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="text-sm">Cuenta origen</label>
        <Select value={String(fromAccountId)} onValueChange={(v) => setFromAccountId(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.currency})</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending || amount <= 0}>{pending ? "..." : "Registrar"}</Button>
    </form>
  );
}
```

- [ ] **Step 3: List page**

Create `app/(dashboard)/gastos/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { operationalExpense, category } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function GastosPage() {
  const rows = await db
    .select({
      id: operationalExpense.id, date: operationalExpense.date,
      description: operationalExpense.description, cup: operationalExpense.cupAmount,
      usd: operationalExpense.usdAmount, categoryName: category.name,
    })
    .from(operationalExpense)
    .leftJoin(category, eq(category.id, operationalExpense.categoryId))
    .orderBy(desc(operationalExpense.date))
    .limit(100);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Gastos</h2>
      <table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2">Categoría</th><th className="p-2">Descripción</th><th className="p-2 text-right">CUP</th><th className="p-2 text-right">USD</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.date?.toLocaleDateString()}</td>
              <td className="p-2">{r.categoryName}</td>
              <td className="p-2">{r.description}</td>
              <td className="p-2 text-right tabular-nums">{Number(r.cup).toLocaleString()}</td>
              <td className="p-2 text-right tabular-nums">{Number(r.usd).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Push, manual test, commit**

```bash
pnpm db:push
pnpm dev
git add -A
git commit -m "feat(gastos): create and list expenses"
```

---

## Phase 6 — Dashboard + Snapshots + Alertas

### Task 6.1: Snapshot domain + cron

- [ ] **Step 1: Domain**

Create `lib/domain/snapshot.ts`:
```ts
import { db } from "@/lib/db";
import { remeseroBalance, wireBuyerBalance, dailySnapshot, config } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function computeDailySnapshot(date: Date) {
  const [tasaCfg] = await db.select().from(config).where(eq(config.key, "tasa_global"));
  const tasa = (tasaCfg?.value as { rate: number } | undefined)?.rate ?? 530;

  const startOfDay = new Date(date); startOfDay.setHours(0,0,0,0);

  const balances = await db.select().from(remeseroBalance);
  const buyerBalances = await db.select().from(wireBuyerBalance);

  const toUsd = (cup: number) => cup / tasa;
  const totalAFavor = balances.filter((b) => Number(b.balanceCup) > 0).reduce((a, b) => a + toUsd(Number(b.balanceCup)), 0)
    + buyerBalances.filter((b) => Number(b.balanceCup) < 0).reduce((a, b) => a + toUsd(Math.abs(Number(b.balanceCup))), 0);
  const totalDebo = balances.filter((b) => Number(b.balanceCup) < 0).reduce((a, b) => a + toUsd(Math.abs(Number(b.balanceCup))), 0)
    + buyerBalances.filter((b) => Number(b.balanceCup) > 0).reduce((a, b) => a + toUsd(Math.abs(Number(b.balanceCup))), 0);

  const capitalNeto = totalAFavor - totalDebo;

  await db.insert(dailySnapshot).values({
    date: startOfDay,
    capitalNetoUsd: String(capitalNeto),
    totalAFavorUsd: String(totalAFavor),
    totalDeboUsd: String(totalDebo),
    tasaGlobalCup: String(tasa),
  }).onConflictDoUpdate({
    target: dailySnapshot.date,
    set: { capitalNetoUsd: String(capitalNeto), totalAFavorUsd: String(totalAFavor), totalDeboUsd: String(totalDebo), tasaGlobalCup: String(tasa), computedAt: new Date() },
  });

  return { capitalNeto, totalAFavor, totalDebo };
}
```

- [ ] **Step 2: Cron route**

Create `app/api/cron/snapshot/route.ts`:
```ts
import { computeDailySnapshot } from "@/lib/domain/snapshot";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  const result = await computeDailySnapshot(new Date());
  return Response.json(result);
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(snapshot): daily snapshot + cron route"
```

### Task 6.2: Dashboard page

- [ ] **Step 1: Replace dashboard**

Replace `app/(dashboard)/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { remeseroBalance, dailySnapshot, alert } from "@/lib/db/schema";
import { desc, isNull, sql } from "drizzle-orm";
import { computeDailySnapshot } from "@/lib/domain/snapshot";
import { CapitalEvolution } from "@/components/charts/capital-evolution";

export default async function Dashboard() {
  await computeDailySnapshot(new Date());

  const [latest] = await db.select().from(dailySnapshot).orderBy(desc(dailySnapshot.date)).limit(1);
  const series = await db.select().from(dailySnapshot).orderBy(dailySnapshot.date).limit(30);
  const activeAlerts = await db.select().from(alert).where(isNull(alert.dismissedAt)).limit(10);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Capital neto</div><div className="text-2xl tabular-nums">${latest ? Number(latest.capitalNetoUsd).toLocaleString() : "0"}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">A tu favor</div><div className="text-2xl tabular-nums text-green-600">${latest ? Number(latest.totalAFavorUsd).toLocaleString() : "0"}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Que debes</div><div className="text-2xl tabular-nums text-red-600">${latest ? Number(latest.totalDeboUsd).toLocaleString() : "0"}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Tasa</div><div className="text-2xl tabular-nums">{latest?.tasaGlobalCup ?? "—"}</div></div>
      </div>
      <section>
        <h3 className="text-lg font-semibold">Evolución capital neto</h3>
        <CapitalEvolution data={series.map((s) => ({ date: s.date.toISOString().slice(0,10), value: Number(s.capitalNetoUsd) }))} />
      </section>
      {activeAlerts.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold">Alertas</h3>
          <ul className="space-y-1 text-sm">{activeAlerts.map((a) => <li key={a.id} className="rounded border p-2">{a.message}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
```

Create `components/charts/capital-evolution.tsx`:
```tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function CapitalEvolution({ data }: { data: Array<{ date: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(dashboard): KPIs, capital evolution, alerts"
```

### Task 6.3: Alerts page

- [ ] **Step 1: Dismiss action**

Create `server/actions/alert.ts`:
```ts
"use server";
import { db } from "@/lib/db";
import { alert } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function dismissAlert(id: number) {
  await db.update(alert).set({ dismissedAt: new Date() }).where(eq(alert.id, id));
  revalidatePath("/alertas");
}
```

- [ ] **Step 2: Page + button**

Create `app/(dashboard)/alertas/page.tsx`:
```tsx
import { db } from "@/lib/db";
import { alert } from "@/lib/db/schema";
import { desc, isNull } from "drizzle-orm";
import { DismissButton } from "./dismiss-button";

export default async function AlertasPage() {
  const active = await db.select().from(alert).where(isNull(alert.dismissedAt)).orderBy(desc(alert.createdAt));
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Alertas</h2>
      {active.length === 0 && <p className="text-muted-foreground">Sin alertas activas.</p>}
      <ul className="space-y-2">
        {active.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="text-xs uppercase text-muted-foreground">{a.level}</div>
              <div>{a.message}</div>
            </div>
            <DismissButton id={a.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Create `app/(dashboard)/alertas/dismiss-button.tsx`:
```tsx
"use client";
import { dismissAlert } from "@/server/actions/alert";
import { Button } from "@/components/ui/button";

export function DismissButton({ id }: { id: number }) {
  return <Button variant="ghost" size="sm" onClick={() => dismissAlert(id)}>Descartar</Button>;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(alerts): list and dismiss"
```

---

## Phase 7 — Polish

### Task 7.1: Responsive QA

- [ ] **Step 1: Test on mobile viewport**

Run: `pnpm dev`
Open DevTools, set to iPhone 12. Verify all pages work, tables scroll horizontally, forms usable.

- [ ] **Step 2: Fix issues and commit**

```bash
git add -A
git commit -m "fix(ui): responsive layout improvements"
```

### Task 7.2: Import script from Excel

- [ ] **Step 1: Script**

Create `scripts/import-excel.ts`:
```ts
import { db } from "../lib/db";
import { remesero, remeseroBalance } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const data = [
  { name: "Jose", usd: 1900, cup: 12500000 },
  { name: "Adrian", usd: 0, cup: 500000 },
];

async function main() {
  for (const row of data) {
    let [r] = await db.select().from(remesero).where(eq(remesero.name, row.name));
    if (!r) [r] = await db.insert(remesero).values({ name: row.name }).returning();
    await db.insert(remeseroBalance).values({
      remeseroId: r.id, balanceUsd: String(row.usd), balanceCup: String(row.cup),
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: { balanceUsd: String(row.usd), balanceCup: String(row.cup), updatedAt: new Date() },
    });
  }
  console.log(`Imported ${data.length} remeseros`);
  process.exit(0);
}
main();
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(import): seed script from Excel"
```

---

## Phase 8 — Deploy

### Task 8.1: Vercel deploy

- [ ] **Step 1: Create repo and push**

```bash
git remote add origin https://github.com/<user>/killer-cuadres.git
git push -u origin main
```

- [ ] **Step 2: Create Neon project, get DATABASE_URL**

- [ ] **Step 3: Import to Vercel, set env, deploy**

- [ ] **Step 4: Run migrations on prod**

```bash
DATABASE_URL=<neon-url> pnpm db:push
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: deploy to Vercel"
```

### Task 8.2: Vercel Cron for snapshot

- [ ] **Step 1: Add vercel.json**

Create `vercel.json`:
```json
{
  "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 23 * * *" }]
}
```

- [ ] **Step 2: Set CRON_SECRET in Vercel env**

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: vercel cron for daily snapshot"
```

---

## Self-Review (executed by author)

**1. Spec coverage:**
- §3.1 Personas (remesero, wire_buyer) — Tasks 2.1, 3.1
- §3.2 Cuentas/accountMovement — Tasks 1.1, 1.2 (account); 2.3, 3.2, 4.1, 5.1 (movements in transactions)
- §3.3 Cuadres (cuadre, cuadreTirada, remeseroBalance, remeseroUsdMovement) — Tasks 2.1, 2.3, 2.4, 2.5
- §3.4 Wires (wire, wireSplit, wirePayment, wireBuyerBalance) — Tasks 3.1, 3.2, 3.3, 3.4, 3.5
- §3.5 Tesorería (currencyExchange) — Task 4.1
- §3.6 Gastos (category, operationalExpense) — Tasks 1.4, 5.1
- §3.7 Snapshots/Alerts (dailySnapshot, alert) — Tasks 6.1, 6.2, 6.3
- §3.8 Config (config) — Task 1.5
- §6.1 Pegar cuadre — Task 2.4
- §6.2 Wire — Task 3.3
- §6.3 Pago wire_buyer — Task 3.5
- §6.4 Compra/venta USD — Task 4.1
- §6.5 Gasto — Task 5.1
- §6.6 Movimiento USD explícito — Task 2.5
- §6.7 Alertas — Task 6.3 (UI; generators a follow-up)
- §5 FIFO algoritmo — Task 3.2

**2. Placeholders scan:** no TBD/TODO/"fill in" found. Some "filtros" UI not yet built — acceptable for MVP, listed in spec §11 fuera de MVP.

**3. Type consistency:** all uses of `wireBuyerId`, `cupAmount`, `usdAmount`, `balanceCup`, `tasaPromedio` consistent across tasks. `cuadre_tirada.consumedByWireId` field name consistent.

**4. Spec gaps identified during plan:** None blocking. Alert generators (insert into `alert` table from each Server Action) are listed in spec §6.7 but not exhaustively implemented in this plan — flagged as follow-up to add in Task 6.3 or later.

---
