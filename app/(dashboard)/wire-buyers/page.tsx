import { db } from "@/lib/db";
import { wireBuyer, wireBuyerBalance } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function WireBuyersPage() {
  const rows = await db
    .select({ id: wireBuyer.id, name: wireBuyer.name, balance: wireBuyerBalance.balanceCup })
    .from(wireBuyer)
    .leftJoin(wireBuyerBalance, eq(wireBuyerBalance.wireBuyerId, wireBuyer.id));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Wire buyers</h2>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">
        <thead><tr className="border-b text-left"><th className="p-2">Nombre</th><th className="p-2 text-right">Deuda CUP</th></tr></thead>
        <tbody>{rows.map((r) => (<tr key={r.id} className="border-b hover:bg-accent"><td className="p-2"><Link href={`/wire-buyers/${r.id}`} className="underline">{r.name}</Link></td><td className="p-2 text-right tabular-nums">{Number(r.balance ?? 0).toLocaleString()}</td></tr>))}</tbody>
      </table></div>
    </div>
  );
}
