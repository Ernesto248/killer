import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { WireForm } from "./wire-form";

export default async function NuevoWirePage() {
  const accounts = await db.select().from(account);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Nuevo wire</h2>
      <WireForm accounts={accounts} />
    </div>
  );
}
