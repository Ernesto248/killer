import { db } from "@/lib/db";
import { account, wireBuyer } from "@/lib/db/schema";
import { WireForm } from "./wire-form";

export const dynamic = "force-dynamic";

export default async function NuevoWirePage() {
  const [accounts, buyers] = await Promise.all([
    db.select().from(account),
    db.select({ id: wireBuyer.id, name: wireBuyer.name }).from(wireBuyer),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Nuevo wire</h2>
      <WireForm accounts={accounts} buyers={buyers} />
    </div>
  );
}
