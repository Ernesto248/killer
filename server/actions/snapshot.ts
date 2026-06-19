"use server";
import { db } from "@/lib/db";
import { snapshotHistory } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveSnapshotAction(data: {
  cupFisico: number; usdFisico: number; tasaGlobal: number;
  remeserosCup: number; remeserosUsd: number;
  wiresCup: number; wiresUsd: number; zelleTotal: number;
  extDebenCup: number; extDeboCup: number; extDebenUsd: number; extDeboUsd: number;
  proyDebenCup: number; proyDeboCup: number; proyDebenUsd: number; proyDeboUsd: number;
  ganancia: number;
}) {
  await db.insert(snapshotHistory).values({
    cupFisico: String(data.cupFisico),
    usdFisico: String(data.usdFisico),
    tasaGlobal: String(data.tasaGlobal),
    remeserosCup: String(data.remeserosCup),
    remeserosUsd: String(data.remeserosUsd),
    wiresCup: String(data.wiresCup),
    wiresUsd: String(data.wiresUsd),
    zelleTotal: String(data.zelleTotal),
    extDebenCup: String(data.extDebenCup),
    extDeboCup: String(data.extDeboCup),
    extDebenUsd: String(data.extDebenUsd),
    extDeboUsd: String(data.extDeboUsd),
    proyDebenCup: String(data.proyDebenCup),
    proyDeboCup: String(data.proyDeboCup),
    proyDebenUsd: String(data.proyDebenUsd),
    proyDeboUsd: String(data.proyDeboUsd),
    ganancia: String(data.ganancia),
  });
  revalidatePath("/historial");
}

export async function deleteSnapshotAction(id: number) {
  await db.delete(snapshotHistory).where(eq(snapshotHistory.id, id));
  revalidatePath("/historial");
}
