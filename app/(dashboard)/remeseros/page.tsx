import { db } from "@/lib/db";
import { remesero, remeseroBalance } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { RemeserosTable } from "./remeseros-table";

export const dynamic = "force-dynamic";

export default async function RemeserosPage() {
  const rows = await db
    .select({ id: remesero.id, name: remesero.name, balanceCup: remeseroBalance.balanceCup, balanceUsd: remeseroBalance.balanceUsd, lastCuadreAt: remeseroBalance.lastCuadreAt })
    .from(remesero)
    .leftJoin(remeseroBalance, eq(remeseroBalance.remeseroId, remesero.id));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Remeseros</h2>
      <RemeserosTable rows={rows} />
    </div>
  );
}
