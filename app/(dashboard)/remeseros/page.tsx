import { db } from "@/lib/db";
import { remesero, remeseroBalance, cuadre } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { RemeserosTable } from "./remeseros-table";

export const dynamic = "force-dynamic";

export default async function RemeserosPage() {
  const rows = await db
    .select({
      id: remesero.id,
      name: remesero.name,
      balanceCup: remeseroBalance.balanceCup,
      balanceUsd: remeseroBalance.balanceUsd,
      lastCuadreAt: remeseroBalance.lastCuadreAt,
    })
    .from(remesero)
    .leftJoin(remeseroBalance, eq(remeseroBalance.remeseroId, remesero.id));

  const labels = await db
    .select({
      remeseroId: cuadre.remeseroId,
      label: cuadre.balanceFinalLabel,
    })
    .from(cuadre)
    .orderBy(desc(cuadre.date));

  const labelMap = new Map<number, string>();
  for (const l of labels) {
    if (!labelMap.has(l.remeseroId)) {
      labelMap.set(l.remeseroId, l.label ?? "");
    }
  }

  const withLabels = rows.map((r) => ({
    ...r,
    lastLabel: labelMap.get(r.id) ?? null,
  }));

  return (
    <div className="space-y-4">
      <RemeserosTable rows={withLabels} />
    </div>
  );
}
