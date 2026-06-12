import { db } from "@/lib/db";
import { dailySnapshot, alert } from "@/lib/db/schema";
import { desc, isNull } from "drizzle-orm";
import { computeDailySnapshot } from "@/lib/domain/snapshot";
import { CapitalEvolution } from "@/components/charts/capital-evolution";

export default async function Dashboard() {
  await computeDailySnapshot(new Date());

  const [latest] = await db.select().from(dailySnapshot).orderBy(desc(dailySnapshot.date)).limit(1);
  const series = await db.select().from(dailySnapshot).orderBy(dailySnapshot.date).limit(30);
  const activeAlerts = await db.select().from(alert).where(isNull(alert.dismissedAt)).limit(10);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded border p-3">
          <div className="text-sm text-muted-foreground">Capital neto</div>
          <div className="text-2xl tabular-nums">${latest ? Number(latest.capitalNetoUsd).toLocaleString() : "0"}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-muted-foreground">A tu favor</div>
          <div className="text-2xl tabular-nums text-green-600">${latest ? Number(latest.totalAFavorUsd).toLocaleString() : "0"}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-muted-foreground">Que debes</div>
          <div className="text-2xl tabular-nums text-red-600">${latest ? Number(latest.totalDeboUsd).toLocaleString() : "0"}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-sm text-muted-foreground">Tasa</div>
          <div className="text-2xl tabular-nums">{latest?.tasaGlobalCup ?? "—"}</div>
        </div>
      </div>
      <section>
        <h3 className="text-lg font-semibold">Evolución capital neto</h3>
        <CapitalEvolution data={series.map((s) => ({ date: s.date.toISOString().slice(0, 10), value: Number(s.capitalNetoUsd) }))} />
      </section>
      {activeAlerts.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold">Alertas</h3>
          <ul className="space-y-1 text-sm">
            {activeAlerts.map((a) => <li key={a.id} className="rounded border p-2">{a.message}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
