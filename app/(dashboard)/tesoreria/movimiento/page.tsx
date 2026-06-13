import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { ExchangeForm } from "./exchange-form";

export default async function MovimientoPage() {
  const accounts = await db.select().from(account);
  return (
    <div className="space-y-4">
      <ExchangeForm accounts={accounts} />
    </div>
  );
}
