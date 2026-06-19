import {
  pgTable, serial, text, timestamp, integer, numeric,
  boolean, jsonb, index,
} from "drizzle-orm/pg-core";

// ============================================
// PERSONAS
// ============================================

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

// ============================================
// CUENTAS Y MOVIMIENTOS
// ============================================

export const account = pgTable("account", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  currency: text("currency").notNull(),
  bank: text("bank"),
  balanceManual: numeric("balance_manual", { precision: 18, scale: 2 }).notNull().default("0"),
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

// ============================================
// CUADRES
// ============================================

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

// ============================================
// WIRES
// ============================================

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
  balanceUsd: numeric("balance_usd", { precision: 18, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TESORERÍA
// ============================================

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

// ============================================
// GASTOS
// ============================================

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

// ============================================
// SNAPSHOTS Y ALERTAS
// ============================================

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

// ============================================
// CONFIG
// ============================================

export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const zelleAccount = pgTable("zelle_account", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bank: text("bank"),
  balanceUsd: numeric("balance_usd", { precision: 18, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const externalDebt = pgTable("external_debt", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  direction: text("direction").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const project = pgTable("project", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  direction: text("direction").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
