import { db } from "@/lib/db";
import { wire, wireSplit, wirePayment, wireBuyer } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PaymentForm } from "./payment-form";

export default async function WireFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wireId = Number(id);
  const [w] = await db.select().from(wire).where(eq(wire.id, wireId));
  if (!w) notFound();
  const [wb] = await db.select().from(wireBuyer).where(eq(wireBuyer.id, w.wireBuyerId));
  const splits = await db.select().from(wireSplit).where(eq(wireSplit.wireId, wireId));
  const payments = await db.select().from(wirePayment).where(eq(wirePayment.wireId, wireId));
  const totalPagado = payments.reduce((a, p) => a + Number(p.cupAmount), 0);
  const cupTotal = Number(w.cupTotal);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Wire #{w.id} — {wb?.name}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">USD</div><div className="text-2xl tabular-nums">{Number(w.usdAmount).toLocaleString()}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">CUP total</div><div className="text-2xl tabular-nums">{cupTotal.toLocaleString()}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Pagado</div><div className="text-2xl tabular-nums">{totalPagado.toLocaleString()}</div></div>
        <div className="rounded border p-3"><div className="text-sm text-muted-foreground">Pendiente</div><div className="text-2xl tabular-nums">{(cupTotal - totalPagado).toLocaleString()}</div></div>
      </div>
      <PaymentForm wireId={w.id} wireBuyerId={w.wireBuyerId} />
      <section><h3 className="text-lg font-semibold">Splits</h3><ul className="text-sm space-y-1">{splits.map((s) => <li key={s.id}>{Number(s.usdAmount).toLocaleString()} USD × {s.tasaDestino} = {Number(s.cupRecibido).toLocaleString()} CUP</li>)}</ul></section>
      <section><h3 className="text-lg font-semibold">Pagos</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="border-b text-left"><th className="p-2">Fecha</th><th className="p-2 text-right">CUP</th><th className="p-2">Nota</th></tr></thead><tbody>{payments.map((p) => (<tr key={p.id} className="border-b"><td className="p-2">{p.date.toLocaleDateString()}</td><td className="p-2 text-right tabular-nums">{Number(p.cupAmount).toLocaleString()}</td><td className="p-2">{p.note ?? ""}</td></tr>))}</tbody></table></div></section>
    </div>
  );
}
