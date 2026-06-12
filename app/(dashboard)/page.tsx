import { db } from "@/lib/db";
import { dailySnapshot, alert } from "@/lib/db/schema";
import { desc, isNull } from "drizzle-orm";
import { computeDailySnapshot } from "@/lib/domain/snapshot";
import { fetchTasas } from "@/lib/fetch-tasas";
import { CapitalEvolution } from "@/components/charts/capital-evolution";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [latest, series, activeAlerts, tasas] = await Promise.all([
    db.select().from(dailySnapshot).orderBy(desc(dailySnapshot.date)).limit(1).then((r) => r[0] ?? null),
    db.select().from(dailySnapshot).orderBy(dailySnapshot.date),
    db.select().from(alert).where(isNull(alert.dismissedAt)).limit(10),
    fetchTasas(),
  ]);

  void computeDailySnapshot(new Date());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Capital neto</div>
          <div className="text-2xl tabular-nums font-semibold mt-1">${latest ? Number(latest.capitalNetoUsd).toLocaleString() : "0"}</div>
        </div>
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">A tu favor</div>
          <div className="text-2xl tabular-nums font-semibold mt-1 text-green-600">${latest ? Number(latest.totalAFavorUsd).toLocaleString() : "0"}</div>
        </div>
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Que debes</div>
          <div className="text-2xl tabular-nums font-semibold mt-1 text-red-600">${latest ? Number(latest.totalDeboUsd).toLocaleString() : "0"}</div>
        </div>
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Tasa global</div>
          <div className="text-2xl tabular-nums font-semibold mt-1">{latest?.tasaGlobalCup ?? "—"}</div>
        </div>
      </div>

      {tasas && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card-apple p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Dólar (CUP)</div>
            <div className="text-2xl tabular-nums font-semibold mt-1">{tasas.usd?.toLocaleString() ?? "—"} CUP</div>
            <div className="text-xs text-muted-foreground mt-1">Actualizado {tasas.updatedAt}</div>
          </div>
          <div className="card-apple p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Euro (CUP)</div>
            <div className="text-2xl tabular-nums font-semibold mt-1">{tasas.eur?.toLocaleString() ?? "—"} CUP</div>
            <div className="text-xs text-muted-foreground mt-1">Actualizado {tasas.updatedAt}</div>
          </div>
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Evolución capital neto</h3>
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
