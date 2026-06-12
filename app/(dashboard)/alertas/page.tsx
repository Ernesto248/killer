import { db } from "@/lib/db";
import { alert } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { desc, isNull } from "drizzle-orm";
import { DismissButton } from "./dismiss-button";

export default async function AlertasPage() {
  const active = await db.select().from(alert).where(isNull(alert.dismissedAt)).orderBy(desc(alert.createdAt));
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Alertas</h2>
      {active.length === 0 && <p className="text-muted-foreground">Sin alertas activas.</p>}
      <ul className="space-y-2">
        {active.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded border p-3">
            <div><div className="text-xs uppercase text-muted-foreground">{a.level}</div><div>{a.message}</div></div>
            <DismissButton id={a.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
