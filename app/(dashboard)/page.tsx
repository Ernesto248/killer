import { db } from "@/lib/db";
import { dailySnapshot, alert, account, accountMovement, remeseroBalance, wireBuyerBalance, cuadre } from "@/lib/db/schema";
import { desc, isNull, sql } from "drizzle-orm";
import { computeDailySnapshot } from "@/lib/domain/snapshot";
import { fetchTasas } from "@/lib/fetch-tasas";
import { CapitalEvolution } from "@/components/charts/capital-evolution";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [series, activeAlerts, tasas, accs, mvBalances, rBalances, wBalances, labels] = await Promise.all([
    db.select().from(dailySnapshot).orderBy(dailySnapshot.date),
    db.select().from(alert).where(isNull(alert.dismissedAt)).limit(10),
    fetchTasas(),
    db.select().from(account),
    db.select({ accountId: accountMovement.accountId, total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(accountMovement)
      .groupBy(accountMovement.accountId),
    db.select().from(remeseroBalance),
    db.select().from(wireBuyerBalance),
    db.select({ remeseroId: cuadre.remeseroId, label: cuadre.balanceFinalLabel })
      .from(cuadre)
      .orderBy(desc(cuadre.date)),
  ]);

  void computeDailySnapshot(new Date());

  const cupAcc = accs.find((a) => a.type === "efectivo_cup");
  const usdAcc = accs.find((a) => a.type === "efectivo_usd");
  const cupBalance = Number(mvBalances.find((b) => b.accountId === cupAcc?.id)?.total ?? 0);
  const usdBalance = Number(mvBalances.find((b) => b.accountId === usdAcc?.id)?.total ?? 0);

  // Latest cuadre label per remesero
  const labelMap = new Map<number, string>();
  for (const l of labels) {
    if (!labelMap.has(l.remeseroId)) labelMap.set(l.remeseroId, l.label ?? "");
  }

  // CUP counterparty net
  let nosDebenCup = 0;
  let debemosCup = 0;
  for (const rb of rBalances) {
    const label = labelMap.get(rb.remeseroId);
    const cup = Number(rb.balanceCup ?? 0);
    if (label === "fondo") {
      nosDebenCup += cup;
    } else if (label === "deuda") {
      debemosCup += cup;
    }
  }
  for (const wb of wBalances) {
    const cup = Number(wb.balanceCup ?? 0);
    if (cup > 0) nosDebenCup += cup;
  }
  const netoCup = nosDebenCup - debemosCup;

  // USD counterparty net
  let nosDebenUsd = 0;
  let debemosUsd = 0;
  for (const rb of rBalances) {
    const usd = Number(rb.balanceUsd ?? 0);
    if (usd > 0) debemosUsd += usd;
    else nosDebenUsd += Math.abs(usd);
  }
  const netoUsd = nosDebenUsd - debemosUsd;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className={cn("card-apple p-4", cupBalance >= 0 ? "bg-green-50/40" : "bg-red-50/40")}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">CUP Físico</div>
          <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1", cupBalance >= 0 ? "text-green-600" : "text-red-600")}>
            {cupBalance.toLocaleString()} CUP
          </div>
        </div>
        <div className={cn("card-apple p-4", usdBalance >= 0 ? "bg-green-50/40" : "bg-red-50/40")}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">USD Físico</div>
          <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1", usdBalance >= 0 ? "text-green-600" : "text-red-600")}>
            {usdBalance.toLocaleString()} USD
          </div>
        </div>
        <div className={cn("card-apple p-4", netoCup >= 0 ? "bg-green-50/40" : "bg-red-50/40")}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Nos deben CUP</div>
          <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1", netoCup >= 0 ? "text-green-600" : "text-red-600")}>
            {netoCup >= 0 ? "+" : ""}{netoCup.toLocaleString()} CUP
          </div>
        </div>
        <div className={cn("card-apple p-4", netoUsd >= 0 ? "bg-green-50/40" : "bg-red-50/40")}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Nos deben USD</div>
          <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1", netoUsd >= 0 ? "text-green-600" : "text-red-600")}>
            {netoUsd >= 0 ? "+" : ""}{netoUsd.toLocaleString()} USD
          </div>
        </div>
      </div>

      {tasas && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">El Toque</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-apple p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Dólar (CUP)</div>
              <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{tasas.usd?.toLocaleString() ?? "—"} CUP</div>
              <div className="text-xs text-muted-foreground mt-1">Actualizado {tasas.updatedAt}</div>
            </div>
            <div className="card-apple p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Euro (CUP)</div>
              <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{tasas.eur?.toLocaleString() ?? "—"} CUP</div>
              <div className="text-xs text-muted-foreground mt-1">Actualizado {tasas.updatedAt}</div>
            </div>
          </div>
        </>
      )}

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Evolución</h3>
        <div className="card-apple p-4">
          <CapitalEvolution data={series.map((s) => ({ date: s.date.toISOString().slice(0, 10), value: Number(s.capitalNetoUsd) }))} />
        </div>
      </section>

      {activeAlerts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Alertas</h3>
          <ul className="space-y-1">
            {activeAlerts.map((a) => <li key={a.id} className="card-apple p-3 text-sm">{a.message}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
