import { db } from "@/lib/db";
import { snapshotHistory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { HistorialClient } from "./historial-client";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const snapshots = await db.select().from(snapshotHistory).orderBy(desc(snapshotHistory.createdAt));
  return <HistorialClient snapshots={snapshots} />;
}
