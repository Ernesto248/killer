import { db } from "@/lib/db";
import { wire, wireBuyer, wirePayment } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";
import { WiresTable } from "./wires-table";

export const dynamic = "force-dynamic";

export default async function WiresPage() {
  const [rows, paymentSums] = await Promise.all([
    db
      .select({ id: wire.id, date: wire.date, buyerName: wireBuyer.name, usd: wire.usdAmount, tasa: wire.tasaCup, cupTotal: wire.cupTotal })
      .from(wire)
      .leftJoin(wireBuyer, eq(wireBuyer.id, wire.wireBuyerId))
      .orderBy(desc(wire.date)),
    db
      .select({ wireId: wirePayment.wireId, total: sql<number>`COALESCE(sum(cup_amount::numeric), 0)` })
      .from(wirePayment)
      .groupBy(wirePayment.wireId),
  ]);

  const paymentMap = new Map(paymentSums.map((p) => [p.wireId, Number(p.total ?? 0)]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/wires/nuevo" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent transition-colors">
          <Plus className="h-4 w-4" /> Nuevo wire
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay wires registrados</div>
      ) : (
        <WiresTable rows={rows} paymentMap={paymentMap} />
      )}
    </div>
  );
}
