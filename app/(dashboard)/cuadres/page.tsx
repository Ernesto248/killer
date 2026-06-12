import { db } from "@/lib/db";
import { cuadre, remesero } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CuadresTable } from "./cuadres-table";

export const dynamic = "force-dynamic";

export default async function CuadresPage() {
  const rows = await db
    .select({
      id: cuadre.id, date: cuadre.date, remeseroName: remesero.name,
      inicial: cuadre.balanceInicialCup, pagado: cuadre.pagadoCup,
      final: cuadre.balanceFinalCup, label: cuadre.balanceFinalLabel,
    })
    .from(cuadre)
    .leftJoin(remesero, eq(remesero.id, cuadre.remeseroId))
    .orderBy(desc(cuadre.date));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Cuadres</h2>
      <CuadresTable rows={rows} />
    </div>
  );
}
