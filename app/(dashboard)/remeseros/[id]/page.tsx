import { db } from "@/lib/db";
import { remesero, cuadre, remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { UsdMovementForm } from "./usd-movement-form";

export default async function RemeseroFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const remeseroId = Number(id);
  const [r] = await db.select().from(remesero).where(eq(remesero.id, remeseroId));
  if (!r) notFound();
  const [balance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, remeseroId));
  const cuadres = await db.select().from(cuadre).where(eq(cuadre.remeseroId, remeseroId)).orderBy(desc(cuadre.date)).limit(50);
  const usdMovs = await db.select().from(remeseroUsdMovement).where(eq(remeseroUsdMovement.remeseroId, remeseroId)).orderBy(desc(remeseroUsdMovement.date)).limit(50);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{r.name}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Balance CUP</div><div className="text-2xl tabular-nums">{Number(balance?.balanceCup ?? 0).toLocaleString()}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Balance USD</div><div className="text-2xl tabular-nums">{Number(balance?.balanceUsd ?? 0).toLocaleString()}</div></div>
      </div>
      <UsdMovementForm remeseroId={remeseroId} />
      <section>
        <h3 className="text-lg font-semibold">Historial de cuadres</h3>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">Inicial</th><th className="p-2 text-right">Pagado</th><th className="p-2 text-right">Final</th><th className="p-2">Label</th></tr></thead>
          <tbody>{cuadres.map((c) => (<tr key={c.id} className="border-b"><td className="p-2">{c.date.toLocaleDateString()}</td><td className="p-2 text-right tabular-nums">{Number(c.balanceInicialCup).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(c.pagadoCup).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(c.balanceFinalCup).toLocaleString()}</td><td className="p-2">{c.balanceFinalLabel}</td></tr>))}</tbody>
        </table></div>
      </section>
      <section>
        <h3 className="text-lg font-semibold">Movimientos USD</h3>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">
          <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">Monto</th><th className="p-2">Nota</th></tr></thead>
          <tbody>{usdMovs.map((m) => (<tr key={m.id} className="border-b"><td className="p-2">{m.date.toLocaleDateString()}</td><td className="p-2 text-right tabular-nums">{Number(m.amount).toLocaleString()}</td><td className="p-2">{m.note ?? ""}</td></tr>))}</tbody>
        </table></div>
      </section>
    </div>
  );
}
