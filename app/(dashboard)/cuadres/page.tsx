import { db } from "@/lib/db";
import { cuadre, remesero } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2">Remesero</th><th className="p-2 text-right">Inicial</th><th className="p-2 text-right">Pagado</th><th className="p-2 text-right">Final</th><th className="p-2">Label</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b"><td className="p-2">{r.date?.toLocaleDateString()}</td><td className="p-2">{r.remeseroName}</td><td className="p-2 text-right tabular-nums">{Number(r.inicial).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(r.pagado).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(r.final).toLocaleString()}</td><td className="p-2">{r.label}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
