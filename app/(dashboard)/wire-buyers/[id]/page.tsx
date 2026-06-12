import { db } from "@/lib/db";
import { wireBuyer, wireBuyerBalance, wire, wirePayment } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function WireBuyerFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const buyerId = Number(id);
  const [wb] = await db.select().from(wireBuyer).where(eq(wireBuyer.id, buyerId));
  if (!wb) notFound();
  const [balance] = await db.select().from(wireBuyerBalance).where(eq(wireBuyerBalance.wireBuyerId, buyerId));
  const wires = await db.select().from(wire).where(eq(wire.wireBuyerId, buyerId)).orderBy(desc(wire.date));
  const payments = await db.select().from(wirePayment).where(eq(wirePayment.wireBuyerId, buyerId)).orderBy(desc(wirePayment.date));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{wb.name}</h2>
      <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Deuda</div><div className="text-2xl tabular-nums">{Number(balance?.balanceCup ?? 0).toLocaleString()} CUP</div></div>
      <section><h3 className="text-lg font-semibold">Wires vendidos</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">USD</th><th className="p-2 text-right">CUP</th><th className="p-2 text-right">Ganancia est.</th></tr></thead><tbody>{wires.map((w) => (<tr key={w.id} className="border-b"><td className="p-2">{w.date.toLocaleDateString()}</td><td className="p-2 text-right tabular-nums">{Number(w.usdAmount).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(w.cupTotal).toLocaleString()}</td><td className="p-2 text-right tabular-nums">{Number(w.gananciaEstimadaCup ?? 0).toLocaleString()}</td></tr>))}</tbody></table></div></section>
      <section><h3 className="text-lg font-semibold">Pagos recibidos</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">CUP</th><th className="p-2">Nota</th></tr></thead><tbody>{payments.map((p) => (<tr key={p.id} className="border-b"><td className="p-2">{p.date.toLocaleDateString()}</td><td className="p-2 text-right tabular-nums">{Number(p.cupAmount).toLocaleString()}</td><td className="p-2">{p.note ?? ""}</td></tr>))}</tbody></table></div></section>
    </div>
  );
}
