import { db } from "@/lib/db";
import { remesero, remeseroBalance } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function RemeserosPage() {
  const rows = await db
    .select({ id: remesero.id, name: remesero.name, balanceCup: remeseroBalance.balanceCup, balanceUsd: remeseroBalance.balanceUsd, lastCuadreAt: remeseroBalance.lastCuadreAt })
    .from(remesero)
    .leftJoin(remeseroBalance, eq(remeseroBalance.remeseroId, remesero.id))
    .orderBy(desc(remeseroBalance.lastCuadreAt));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Remeseros</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Nombre</th><th className="p-2 text-right">Balance CUP</th><th className="p-2 text-right">Balance USD</th><th className="p-2">Último cuadre</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-accent">
                <td className="p-2"><Link href={`/remeseros/${r.id}`} className="underline">{r.name}</Link></td>
                <td className="p-2 text-right tabular-nums">{Number(r.balanceCup ?? 0).toLocaleString()}</td>
                <td className="p-2 text-right tabular-nums">{Number(r.balanceUsd ?? 0).toLocaleString()}</td>
                <td className="p-2 text-muted-foreground">{r.lastCuadreAt?.toLocaleDateString() ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
