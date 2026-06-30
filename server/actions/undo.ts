"use server";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  externalDebt,
  account,
  category,
  project,
  remesero,
  remeseroBalance,
  undoAction,
  wireItem,
  zelleAccount,
} from "@/lib/db/schema";

type UndoPayload =
  | { table: "externalDebt"; action: "delete" | "restore" | "update"; id: number; before?: ExternalDebtRow; after?: ExternalDebtRow }
  | { table: "account"; action: "delete" | "restore" | "update"; id: number; before?: AccountRow; after?: AccountRow }
  | { table: "category"; action: "delete" | "restore" | "update"; id: number; before?: CategoryRow; after?: CategoryRow }
  | { table: "project"; action: "delete" | "restore" | "update"; id: number; before?: ProjectRow; after?: ProjectRow }
  | { table: "wireItem"; action: "delete" | "restore" | "update"; id: number; before?: WireItemRow; after?: WireItemRow }
  | { table: "zelleAccount"; action: "delete" | "restore" | "update"; id: number; before?: ZelleRow; after?: ZelleRow }
  | { table: "remesero"; action: "delete" | "restore" | "update"; id: number; before?: RemeseroUndoRow; after?: RemeseroUndoRow };

type ExternalDebtRow = typeof externalDebt.$inferSelect;
type AccountRow = typeof account.$inferSelect;
type CategoryRow = typeof category.$inferSelect;
type ProjectRow = typeof project.$inferSelect;
type WireItemRow = typeof wireItem.$inferSelect;
type ZelleRow = typeof zelleAccount.$inferSelect;
type RemeseroUndoRow = {
  remesero: typeof remesero.$inferSelect;
  balance: typeof remeseroBalance.$inferSelect | null;
};

export async function recordUndo(input: {
  description: string;
  kind: string;
  payload: UndoPayload;
  paths: string[];
}) {
  await db.insert(undoAction).values({
    description: input.description,
    kind: input.kind,
    payload: input.payload,
    paths: input.paths,
  });
}

export async function getLastUndoAction() {
  const [row] = await db
    .select({
      id: undoAction.id,
      description: undoAction.description,
      createdAt: undoAction.createdAt,
    })
    .from(undoAction)
    .where(isNull(undoAction.undoneAt))
    .orderBy(desc(undoAction.createdAt), desc(undoAction.id))
    .limit(1);
  return row ?? null;
}

export async function undoLastAction(id: number) {
  const [row] = await db
    .select()
    .from(undoAction)
    .where(and(eq(undoAction.id, id), isNull(undoAction.undoneAt)))
    .limit(1);
  if (!row) throw new Error("No hay cambio disponible para deshacer.");

  const payload = row.payload as UndoPayload;
  await db.transaction(async (tx) => {
    if (payload.table === "externalDebt") await applySimpleUndo(tx, externalDebt, payload);
    else if (payload.table === "account") await applySimpleUndo(tx, account, payload);
    else if (payload.table === "category") await applySimpleUndo(tx, category, payload);
    else if (payload.table === "project") await applySimpleUndo(tx, project, payload);
    else if (payload.table === "wireItem") await applySimpleUndo(tx, wireItem, payload);
    else if (payload.table === "zelleAccount") await applySimpleUndo(tx, zelleAccount, payload);
    else if (payload.table === "remesero") await applyRemeseroUndo(tx, payload);

    await tx.update(undoAction).set({ undoneAt: new Date() }).where(eq(undoAction.id, row.id));
  });

  for (const path of row.paths as string[]) revalidatePath(path);
}

async function applySimpleUndo(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  table: typeof externalDebt | typeof account | typeof category | typeof project | typeof wireItem | typeof zelleAccount,
  payload: Extract<UndoPayload, { table: "externalDebt" | "account" | "category" | "project" | "wireItem" | "zelleAccount" }>,
) {
  if (payload.action === "delete") {
    await tx.delete(table).where(eq(table.id, payload.id));
    return;
  }
  if (payload.action === "restore" && payload.before) {
    await tx.insert(table).values(mapSimpleRow(payload.table, payload.before) as never);
    return;
  }
  if (payload.action === "update" && payload.before) {
    await tx.update(table).set(mapSimpleUpdate(payload.table, payload.before) as never).where(eq(table.id, payload.id));
  }
}

async function applyRemeseroUndo(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  payload: Extract<UndoPayload, { table: "remesero" }>,
) {
  if (payload.action === "delete") {
    await tx.delete(remeseroBalance).where(eq(remeseroBalance.remeseroId, payload.id));
    await tx.delete(remesero).where(eq(remesero.id, payload.id));
    return;
  }

  if (payload.action === "restore" && payload.before) {
    await tx.insert(remesero).values(mapRemeseroInsert(payload.before.remesero));
    if (payload.before.balance) {
      await tx.insert(remeseroBalance).values(mapRemeseroBalance(payload.before.balance));
    }
    return;
  }

  if (payload.action === "update" && payload.before) {
    await tx.update(remesero).set(mapRemeseroUpdate(payload.before.remesero)).where(eq(remesero.id, payload.id));
    if (payload.before.balance) {
      await tx.insert(remeseroBalance).values(mapRemeseroBalance(payload.before.balance)).onConflictDoUpdate({
        target: remeseroBalance.remeseroId,
        set: mapRemeseroBalanceUpdate(payload.before.balance),
      });
    }
  }
}

function mapSimpleRow(
  tableName: Extract<UndoPayload, { table: "externalDebt" | "account" | "category" | "project" | "wireItem" | "zelleAccount" }>["table"],
  row: ExternalDebtRow | AccountRow | CategoryRow | ProjectRow | WireItemRow | ZelleRow,
) {
  if (tableName === "externalDebt") {
    const debt = row as ExternalDebtRow;
    return {
      id: debt.id,
      name: debt.name,
      amount: debt.amount,
      currency: debt.currency,
      direction: debt.direction,
      notes: debt.notes,
      isActive: debt.isActive,
      createdAt: asDate(debt.createdAt),
    };
  }
  if (tableName === "account") {
    const accountRow = row as AccountRow;
    return {
      id: accountRow.id,
      name: accountRow.name,
      type: accountRow.type,
      currency: accountRow.currency,
      bank: accountRow.bank,
      balanceManual: accountRow.balanceManual,
      isActive: accountRow.isActive,
      createdAt: asDate(accountRow.createdAt),
    };
  }
  if (tableName === "category") {
    const categoryRow = row as CategoryRow;
    return {
      id: categoryRow.id,
      name: categoryRow.name,
      isActive: categoryRow.isActive,
      createdAt: asDate(categoryRow.createdAt),
    };
  }
  if (tableName === "project") {
    const projectRow = row as ProjectRow;
    return {
      id: projectRow.id,
      name: projectRow.name,
      amount: projectRow.amount,
      currency: projectRow.currency,
      direction: projectRow.direction,
      notes: projectRow.notes,
      isActive: projectRow.isActive,
      createdAt: asDate(projectRow.createdAt),
    };
  }
  if (tableName === "wireItem") {
    const wireRow = row as WireItemRow;
    return {
      id: wireRow.id,
      name: wireRow.name,
      amount: wireRow.amount,
      currency: wireRow.currency,
      direction: wireRow.direction,
      notes: wireRow.notes,
      isActive: wireRow.isActive,
      createdAt: asDate(wireRow.createdAt),
    };
  }
  const zelleRow = row as ZelleRow;
  return {
    id: zelleRow.id,
    name: zelleRow.name,
    bank: zelleRow.bank,
    balanceUsd: zelleRow.balanceUsd,
    isActive: zelleRow.isActive,
    createdAt: asDate(zelleRow.createdAt),
  };
}

function mapSimpleUpdate(
  tableName: Extract<UndoPayload, { table: "externalDebt" | "account" | "category" | "project" | "wireItem" | "zelleAccount" }>["table"],
  row: ExternalDebtRow | AccountRow | CategoryRow | ProjectRow | WireItemRow | ZelleRow,
) {
  const mapped = mapSimpleRow(tableName, row);
  const { id: _id, createdAt: _createdAt, ...updatable } = mapped;
  return updatable;
}

function mapRemeseroInsert(row: typeof remesero.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    isActive: row.isActive,
    createdAt: asDate(row.createdAt),
  };
}

function mapRemeseroUpdate(row: typeof remesero.$inferSelect) {
  return {
    name: row.name,
    notes: row.notes,
    isActive: row.isActive,
  };
}

function mapRemeseroBalance(row: typeof remeseroBalance.$inferSelect) {
  return {
    remeseroId: row.remeseroId,
    balanceCup: row.balanceCup,
    balanceUsd: row.balanceUsd,
    lastCuadreAt: asNullableDate(row.lastCuadreAt),
    updatedAt: asDate(row.updatedAt),
  };
}

function mapRemeseroBalanceUpdate(row: typeof remeseroBalance.$inferSelect) {
  return {
    balanceCup: row.balanceCup,
    balanceUsd: row.balanceUsd,
    lastCuadreAt: asNullableDate(row.lastCuadreAt),
    updatedAt: asDate(row.updatedAt),
  };
}

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function asNullableDate(value: Date | string | null) {
  if (!value) return null;
  return asDate(value);
}
