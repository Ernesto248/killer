import { db } from "@/lib/db";
import { wire, wireBuyer } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { eq, desc } from "drizzle-orm";

export default async function WiresPage() {
  const rows = await db
    .select({ id: wire.id, date: wire.date, buyerName: wireBuyer.name, usd: wire.usdAmount, cupTotal: wire.cupTotal, ganancia: wire.gananciaEstimadaCup })
    .from(wire)
    .leftJoin(wireBuyer, eq(wireBuyer.id, wire.wireBuyerId))
    .orderBy(desc(wire.date))
    .limit(50);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Wires</h2>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2">Buyer</th><th className="p-2 text-right">USD</th><th className="p-2 text-right">CUP Total</th><th className="p-2 text-right">Ganancia</th></tr></thead>
        <tbody>{rows.map((r) => (<tr key={r.id} className="border-b"><td className="p-2">{r.date?.toLocaleDateString()}</td><td className="p-2">{r.buyerName}</td><td className="p-2 text-right tabular-nums">{Number(r.usd).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(r.cupTotal).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(r.ganancia ?? 0).toLocaleString()}</td></tr>))}</tbody>
      </table></div>
    </div>
  );
}
