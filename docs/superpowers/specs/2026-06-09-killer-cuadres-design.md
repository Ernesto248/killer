# Sistema de Gestión de Remesas y Divisas — Diseño

**Fecha**: 2026-06-09
**Cliente**: José (operador único)
**Estado**: Aprobado, listo para plan de implementación

## 1. Resumen ejecutivo

Web app responsive para reemplazar el flujo actual de José (WhatsApp + Excel) en la administración de remesas Zelle, ventas de wire, compra/venta de USD físico, gastos operativos y deudas con contrapartes (remeseros y compradores de wire). Un solo usuario, sin login en MVP. Optimizado para uso móvil y desktop.

**Problema a resolver**: error humano en el cuadre manual, falta de visibilidad en tiempo real de balances, deudas y ganancias.

**Stack**: Next.js 15 (App Router) + TypeScript + Drizzle ORM + Postgres (Neon) + Vercel. UI: `getdesign apple` como base + `shadcn/ui` para componentes de datos densos.

## 2. Decisiones de producto

| # | Decisión | Elección |
|---|---|---|
| 1 | Tipo de app | Web responsive (sin PWA, sin nativo) |
| 2 | Usuarios | Un solo usuario (José), sin login |
| 3 | Captura de cuadre | Pegar texto de WhatsApp + parseo automático con editor de fallback |
| 4 | Persistencia | Postgres gestionado (Neon) |
| 5 | Deploy | Vercel + Neon |
| 6 | Cálculo de ganancia wire | FIFO: tasa ponderada de los USD consumidos en tiradas |
| 7 | Alta de contrapartes | Libre (autocompletar al pegar cuadre) |
| 8 | Extras | Notificaciones/alertas in-app |
| 9 | Duplicados de cuadre | Crear evento nuevo siempre (registro histórico) |
| 10 | `getdesign` | Sí, como base UI + shadcn para datos densos |
| 11 | Gastos mixtos | Una moneda por gasto; si mixto, 2 gastos |
| 12 | Edición | Libre, con validaciones de integridad FIFO |
| 13 | Remeseros vs Wire Buyers | Entidades separadas (mismo nombre ≠ misma persona) |

## 3. Modelo de datos

### 3.1 Personas

- **remesero**: persona que entrega Zelle a la LLC y recibe pago en CUP vía cuadres.
- **wire_buyer**: persona a la que José vende un wire. Mantiene deuda con José (pagadera por abonos parciales).

Una persona puede existir en ambas tablas con el mismo nombre. No se vinculan.

### 3.2 Cuentas y tesorería

- **account**: cuentas físicas del negocio. Tipos: `llc_usa`, `efectivo_cup`, `efectivo_usd`. Seed inicial: LLC USA, CUP Físico, USD Físico.
- **account_movement**: cada movimiento (entrada/salida) en una cuenta. Vinculado por `refType` + `refId` al evento que lo origina.

### 3.3 Cuadres y remeseros

- **cuadre**: cada pegada de WhatsApp es un evento histórico. Campos: `balanceInicialCup`, `pagadoCup`, `pendientesUsd`, `pendientesTasa`, `tiradoItems` (JSONB), `balanceFinalCup`, `balanceFinalLabel` (`deuda` | `fondo`), `rawText`.
- **cuadre_tirada**: cada fila `usd × tasa` del cuadre se descompone en un registro. Habilita el FIFO. Campo `consumedByWireId` marca si ya fue consumido por un wire.
- **remesero_balance**: cache del balance CUP y USD del remesero. Recalculable.
- **remesero_usd_movement**: débitos/créditos explícitos en USD del remesero (independiente del cuadre).

### 3.4 Wires y wire_buyers

- **wire**: venta de wire/Zelle de la LLC. Campos: `usdAmount`, `tasaCup`, `cupTotal`, `gananciaEstimadaCup`, `wireBuyerId`.
- **wire_split**: distribución del wire entre cuentas físicas de José. Una o más filas con `destinoAccountId`, `usdAmount`, `tasaDestino`. La suma de USD debe igualar el total del wire.
- **wire_payment**: abonos parciales que el wire_buyer hace a José. Reduce `wireBuyerBalance`.
- **wire_buyer_balance**: cache del saldo. Positivo = el wire_buyer debe a José.

### 3.5 Tesorería

- **currency_exchange**: compra/venta de USD físico. Campos: `direction` (`compra_usd` | `venta_usd`), `usdAmount`, `tasa`, `cupAmount`, `fromAccountId`, `toAccountId`.

### 3.6 Gastos

- **category**: catálogo editable. Seed: Gasolina, Transporte, Salarios, Comida, Servicios, Otros.
- **operational_expense**: un gasto es de una sola moneda (CUP o USD). `cupAmount` y `usdAmount` son mutuamente excluyentes en UI. Si el gasto es mixto, se crean 2 gastos.

### 3.7 Snapshots y alertas

- **daily_snapshot**: cierre diario con capital neto, total a favor, total que debo, tasa global.
- **alert**: alertas generadas in-app. Tipos: `no_cuadre_3d`, `saldo_bajo`, `capital_caida`, `tasa_sin_registrar`, `gasto_pico`. Soft dismiss con `dismissedAt`.

### 3.8 Config

- **config**: key/value. Claves: `tasa_global`, `dias_sin_cuadre_alerta`, `umbrales_saldo_cuenta` (JSONB).

### 3.9 Esquema SQL (Drizzle)

```ts
// lib/db/schema.ts
import { pgTable, serial, text, timestamp, integer, numeric, boolean, jsonb, index, unique, isNull } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const remesero = pgTable("remesero", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("remesero_name_idx").on(t.name),
}));

export const wireBuyer = pgTable("wire_buyer", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  nameIdx: index("wire_buyer_name_idx").on(t.name),
}));

export const account = pgTable("account", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  currency: text("currency").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountMovement = pgTable("account_movement", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => account.id),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  refType: text("ref_type").notNull(),
  refId: integer("ref_id"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  accountIdx: index("mv_account_idx").on(t.accountId),
  dateIdx: index("mv_date_idx").on(t.date),
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
  remeseroIdx: index("tirada_remesero_idx").on(t.remeseroId),
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
  wireBuyerId: integer("wire_buyer_id").notNull().references(() => wireBuyer.id),    // denormalizado para query rápido
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

export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
}, (t) => ({
  dateIdx: index("expense_date_idx").on(t.date),
  categoryIdx: index("expense_category_idx").on(t.categoryId),
}));

export const dailySnapshot = pgTable("daily_snapshot", {
  date: timestamp("date").primaryKey(),
  capitalNetoUsd: numeric("capital_neto_usd", { precision: 18, scale: 2 }).notNull(),
  totalAFavorUsd: numeric("total_a_favor_usd", { precision: 18, scale: 2 }).notNull(),
  totalDeboUsd: numeric("total_debo_usd", { precision: 18, scale: 2 }).notNull(),
  tasaGlobalCup: numeric("tasa_global_cup", { precision: 8, scale: 2 }),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

export const alert = pgTable("alert", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  refType: text("ref_type"),
  refId: integer("ref_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dismissedAt: timestamp("dismissed_at"),
}, (t) => ({
  dismissedIdx: index("alert_dismissed_idx").on(t.dismissedAt),
}));

export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## 4. Pantallas y rutas

| Ruta | Función |
|---|---|
| `/` | Dashboard con KPIs, top contrapartes, gráfico de capital neto |
| `/cuadres/nuevo` | Pegar cuadre de WhatsApp con preview estructurada |
| `/cuadres` | Histórico de cuadres (filtros: fecha, remesero) |
| `/wires/nuevo` | Registrar wire con split por monto exacto a cuentas físicas |
| `/wires` | Histórico de wires |
| `/wires/[id]` | Ficha del wire + registrar pagos del wire_buyer |
| `/wire-buyers` | Lista de compradores de wire con deuda |
| `/wire-buyers/[id]` | Ficha con deuda, wires vendidos, pagos |
| `/remeseros` | Lista de remeseros con balance |
| `/remeseros/[id]` | Ficha con historial de cuadres, movimientos USD |
| `/tesoreria/movimiento` | Compra/venta USD físico |
| `/gastos/nuevo` + `/gastos` | Crear y listar gastos operativos |
| `/alertas` | Bandeja de alertas |
| `/config` | Cuentas, categorías, tasa global, umbrales |

## 5. Algoritmo FIFO de consumo de tiradas

Al crear un wire, dentro de una transacción con lock pesimista:

1. Buscar `cuadre_tirada` con `consumed_by_wire_id IS NULL`, ordenadas por `date ASC, id ASC`.
2. Tomar tiradas en orden hasta sumar `wire.usdAmount`.
3. Calcular `tasa_promedio_ponderada = Σ(usd_usado × tasa) / Σ usd_usado`.
4. Para cada tirada consumida:
   - Si se consume toda: marcar `consumed_by_wire_id = wire.id`, `consumed_at = now()`.
   - Si se consume parcialmente: dividir la tirada (insertar nueva con el resto sin consumir, marcar la original como consumida por completo).
5. `ganancia = Σ_split (usd_split × (tasa_destino − tasa_promedio_ponderada))`.
6. Guardar `wire.gananciaEstimadaCup`.
7. Incrementar `wireBuyerBalance.balanceCup` por `wire.cupTotal` (deuda del wire_buyer).
8. Generar `accountMovement` por cada split: −USD en LLC USA, +monto en cuenta destino.
9. Si `Σ usd_disponible < wire.usdAmount`, abortar con error claro: "No hay suficientes USD disponibles en tiradas para cubrir el wire".

**Al editar un wire**: recalcular FIFO desde cero (devolver tiradas consumidas poniendo `consumedByWireId = NULL`, reconsumir con el nuevo cálculo). Advertencia explícita al usuario.

**Al editar un cuadre con tiradas consumidas**: validar atómicamente que las tiradas resultantes (después de la edición) pueden "devolver" los USD consumidos. Si no, error. La edición del cuadre preserva `consumedByWireId`/`consumedAt` de las tiradas existentes; si una tirada se modifica, se trata como nueva (consumida por el wire que la apuntaba o no consumida, según el caso).

## 6. Flujos de uso

### 6.1 Pegar cuadre (flujo principal)

1. José copia el mensaje del cuadre del grupo de WhatsApp.
2. Abre `/cuadres/nuevo`, pega en el `<textarea>`.
3. En vivo, parser con regex extrae: remesero, balance inicial, pagado, pendientes, tirado (lista), balance final + label.
4. Vista previa estructurada con campos editables. Si el remesero no existe, autocompletar sugiere crearlo.
5. Botón "Registrar cuadre":
   - Crea `cuadre` + N `cuadre_tirada`.
   - Actualiza `remesero_balance` (nuevo balance = balance final del cuadre).
   - Genera `account_movement` en `CUP Físico` restando el `pagadoCup`.
   - Recalcula `daily_snapshot` del día.

### 6.2 Crear wire (venta)

1. `/wires/nuevo`: wire_buyer, fecha, USD, tasa referencia, split (N filas con cuenta destino + USD + tasa destino), nota.
2. Server Action `createWire` ejecuta el algoritmo FIFO en transacción.
3. Muestra wire creado con ganancia estimada y deuda del wire_buyer.

### 6.3 Registrar pago del wire_buyer

1. En `/wires/[id]`, botón "Registrar pago" → modal con fecha, monto CUP, nota.
2. Crea `wire_payment`, reduce `wire_buyer_balance`, genera `account_movement` en `CUP Físico`.

### 6.4 Compra/venta USD físico

1. `/tesoreria/movimiento`: toggle compra/venta, USD, tasa, CUP (auto), nota.
2. Crea `currency_exchange` + 2 `account_movement` (sale de una cuenta, entra a otra).

### 6.5 Gasto operativo

1. `/gastos/nuevo`: fecha, categoría, descripción, monto (CUP o USD, no ambos), cuenta origen, nota.
2. Crea `operational_expense` + `account_movement` restando de la cuenta origen.

### 6.6 Movimiento USD explícito de remesero

1. En ficha del remesero, botón "Registrar movimiento USD" → modal con fecha, monto, nota.
2. Crea `remesero_usd_movement`, actualiza `remesero_balance.balanceUsd`, genera `account_movement` en `USD Físico`.

### 6.7 Alertas

Generadas en Server Actions al guardar eventos:
- `no_cuadre_3d`: último cuadre del remesero > 3 días. Warning.
- `saldo_bajo`: balance de cuenta < umbral configurado. Warning/Critical.
- `capital_caida`: `daily_snapshot.capital_neto_usd` cayó > 10% vs día anterior. Warning.
- `tasa_sin_registrar`: `daily_snapshot` del día sin crear. Info.
- `gasto_pico`: gasto de categoría este mes > 1.5× mes anterior. Info.

Visualización: campanita con badge en header. Pantalla `/alertas` con soft dismiss.

## 7. Plan de implementación por fases

| Fase | Alcance | Días estimados |
|---|---|---|
| 0 | Setup Next.js + Drizzle + Neon + Biome + tests + `getdesign apple` + shadcn + layout shell | 1-2 |
| 1 | Cuentas y catálogo (account, category, config) con CRUD en `/config` + seeds | 2-3 |
| 2 | Remeseros y cuadres con parser WhatsApp exhaustivo | 5-7 |
| 3 | Wire buyers y wires con FIFO atómico | 5-7 |
| 4 | Tesorería (compra/venta USD físico) | 2-3 |
| 5 | Gastos operativos con categorías | 2-3 |
| 6 | Dashboard, snapshots diarios y alertas | 3-4 |
| 7 | Polish responsive, empty/loading states, import del Excel | 3-4 |
| 8 | Deploy Vercel + capacitación con José | 2-3 |

**Total**: ~6-8 semanas a ritmo full-time.

## 8. Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) |
| Lenguaje | TypeScript (strict) |
| UI base | `getdesign apple` |
| UI datos | shadcn/ui (Table, DataTable, Form, DatePicker, Command, Dialog) |
| Formularios | React Hook Form + Zod |
| ORM | Drizzle ORM |
| DB | PostgreSQL (Neon free tier) |
| Migraciones | Drizzle Kit |
| Auth | Ninguno (1 usuario) |
| Hosting | Vercel |
| Gráficos | Recharts |
| Fechas | date-fns |
| Tests | Vitest + Testing Library + Playwright |
| CI | GitHub Actions |
| Lint/Format | Biome |

## 9. Estructura de carpetas

```
/app                    # Next.js App Router
  /(dashboard)          # Rutas con layout compartido
    /page.tsx           # Dashboard
    /cuadres/...
    /wires/...
    /remeseros/...
    /wire-buyers/...
    /tesoreria/...
    /gastos/...
    /alertas/...
    /config/...
  /api/                 # Route handlers (futuro)
  /layout.tsx
  /globals.css
/components
  /ui                   # getdesign + shadcn primitives
  /forms                # formularios compuestos
  /charts
  /cuadre-parser        # lógica de parseo del WhatsApp
/lib
  /db                   # Drizzle schema + queries
  /domain               # casos de uso (puros, sin React)
  /validators           # schemas Zod
  /utils
/server
  /actions              # Server Actions
/drizzle                # migraciones
/tests
  /unit
  /integration
  /e2e
/infra
  docker-compose.yml    # Postgres local para dev
  .env.example
```

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Parser WhatsApp falla con formato no esperado | UI editable + suite de tests con 50+ variantes reales |
| FIFO parcial deja "restos" que complican cálculos | Función de reconciliación al inicio de cada Server Action |
| Edición de cuadre con tiradas consumidas | Validación atómica en transacción, error claro al usuario |
| getdesign apple no cubre tablas/forms densos | shadcn/ui para esos componentes; audit de 1 día en Fase 0 |
| Sin auth: cualquiera con la URL entra | Aceptado para MVP; documentado en fuera-de-alcance |
| José pierde el celular | Backups automáticos Neon + export CSV mensual |
| Mismo nombre para remesero y wire_buyer confunde | UI muestra claramente la separación; balances solo del dominio correcto |

## 11. Fuera del MVP (futuro)

- Login / multi-usuario
- Reportes avanzados y gráficos históricos largos
- App nativa móvil
- Notificaciones push / email
- OCR de capturas de Zelle
- Multi-tenancy (varios Josées)
- API pública / integraciones con bancos
- Auditoría / log de cambios
- Sincronización offline
