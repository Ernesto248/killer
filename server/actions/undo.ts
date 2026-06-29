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
    await tx.insert(table).values(payload.before as never);
    return;
  }
  if (payload.action === "update" && payload.before) {
    await tx.update(table).set(payload.before as never).where(eq(table.id, payload.id));
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
    await tx.insert(remesero).values(payload.before.remesero);
    if (payload.before.balance) await tx.insert(remeseroBalance).values(payload.before.balance);
    return;
  }

  if (payload.action === "update" && payload.before) {
    await tx.update(remesero).set(payload.before.remesero).where(eq(remesero.id, payload.id));
    if (payload.before.balance) {
      await tx.insert(remeseroBalance).values(payload.before.balance).onConflictDoUpdate({
        target: remeseroBalance.remeseroId,
        set: payload.before.balance,
      });
    }
  }
}
