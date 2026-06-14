import { db } from "@/lib/db";
import { dailySnapshot, alert, account, accountMovement, remeseroBalance, wireBuyerBalance, cuadre } from "@/lib/db/schema";
import { desc, isNull, sql, gte, and } from "drizzle-orm";
import { computeDailySnapshot } from "@/lib/domain/snapshot";
import { fetchTasas } from "@/lib/fetch-tasas";
import { CapitalEvolution } from "@/components/charts/capital-evolution";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function fmt(n: number) { return n.toLocaleString("es-ES", { useGrouping: true }); }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ chart?: string }>;
}) {
  const sp = await searchParams;
  const chartMode = sp.chart === "usd" ? "usd" : "cup";

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activeAlerts, tasas, accs, mvBalances, rBalances, wBalances, labels, weekMovs] = await Promise.all([
    db.select().from(alert).where(isNull(alert.dismissedAt)).limit(10),
    fetchTasas(),
    db.select().from(account),
    db.select({ accountId: accountMovement.accountId, total: sql<number>`COALESCE(SUM(amount::numeric), 0)` }).from(accountMovement).groupBy(accountMovement.accountId),
    db.select().from(remeseroBalance),
    db.select().from(wireBuyerBalance),
    db.select({ remeseroId: cuadre.remeseroId, label: cuadre.balanceFinalLabel }).from(cuadre).orderBy(desc(cuadre.date)),
    db.select({ date: accountMovement.date, amount: accountMovement.amount, accountId: accountMovement.accountId, currency: accountMovement.currency })
      .from(accountMovement)
      .where(gte(accountMovement.date, weekAgo)),
  ]);

  void computeDailySnapshot(new Date());

  const cupAcc = accs.find((a) => a.type === "efectivo_cup");
  const usdAcc = accs.find((a) => a.type === "efectivo_usd");
  const cupBalance = Number(mvBalances.find((b) => b.accountId === cupAcc?.id)?.total ?? 0);
  const usdBalance = Number(mvBalances.find((b) => b.accountId === usdAcc?.id)?.total ?? 0);

  const labelMap = new Map<number, string>();
  for (const l of labels) { if (!labelMap.has(l.remeseroId)) labelMap.set(l.remeseroId, l.label ?? ""); }

  let nosDebenCup = 0; let debemosCup = 0;
  for (const rb of rBalances) {
    const cup = Number(rb.balanceCup ?? 0);
    if (labelMap.get(rb.remeseroId) === "fondo") nosDebenCup += cup;
    else if (labelMap.get(rb.remeseroId) === "deuda") debemosCup += cup;
  }
  const remeserosCup = nosDebenCup - debemosCup;

  let nosDebenUsd = 0; let debemosUsd = 0;
  for (const rb of rBalances) {
    const usd = Number(rb.balanceUsd ?? 0);
    if (usd > 0) debemosUsd += usd;
    else nosDebenUsd += Math.abs(usd);
  }
  const remeserosUsd = nosDebenUsd - debemosUsd;

  let wireCup = 0; let wireUsd = 0;
  for (const wb of wBalances) {
    wireCup += Number(wb.balanceCup ?? 0);
    wireUsd += Number(wb.balanceUsd ?? 0);
  }

  const cards = [
    { label: "CUP Físico", value: cupBalance, suffix: "CUP" },
    { label: "USD Físico", value: usdBalance, suffix: "USD" },
    { label: "Remeseros CUP", value: remeserosCup, suffix: "CUP" },
    { label: "Remeseros USD", value: remeserosUsd, suffix: "USD" },
    { label: "Wires pend. CUP", value: wireCup, suffix: "CUP" },
    { label: "Wires pend. USD", value: wireUsd, suffix: "USD" },
  ];

  // Weekly balance chart data
  const targetId = chartMode === "usd" ? usdAcc?.id : cupAcc?.id;
  const dailyMap = new Map<string, number>();
  for (const m of weekMovs) {
    if (m.accountId !== targetId) continue;
    const d = m.date.toISOString().slice(0, 10);
    dailyMap.set(d, (dailyMap.get(d) ?? 0) + Number(m.amount));
  }
  let cumulative = 0;
  const chartData: Array<{ date: string; value: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    cumulative += dailyMap.get(d) ?? 0;
    chartData.push({ date: d.slice(5), value: Math.round(cumulative) });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={cn("card-apple p-4", c.value >= 0 ? "bg-green-50/40" : "bg-red-50/40")}>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</div>
            <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1", c.value >= 0 ? "text-green-600" : "text-red-600")}>
              {c.value >= 0 ? "+" : ""}{fmt(c.value)} {c.suffix}
            </div>
          </div>
        ))}
      </div>

      {tasas && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">El Toque</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-apple p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Dólar (CUP)</div>
              <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{tasas.usd?.toLocaleString() ?? "—"} CUP</div>
              <div className="text-xs text-muted-foreground mt-1">{timeAgo(tasas.ts)}</div>
            </div>
            <div className="card-apple p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Euro (CUP)</div>
              <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{tasas.eur?.toLocaleString() ?? "—"} CUP</div>
              <div className="text-xs text-muted-foreground mt-1">{timeAgo(tasas.ts)}</div>
            </div>
          </div>
        </>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Última semana — {chartMode === "usd" ? "USD" : "CUP"} Físico
          </h3>
          <div className="flex gap-1">
            <a href="?chart=cup" className={cn("rounded-lg px-2 py-1 text-xs font-medium transition-colors", chartMode === "cup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>CUP</a>
            <a href="?chart=usd" className={cn("rounded-lg px-2 py-1 text-xs font-medium transition-colors", chartMode === "usd" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>USD</a>
          </div>
        </div>
        <div className="card-apple p-4">
          <CapitalEvolution data={chartData} />
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
