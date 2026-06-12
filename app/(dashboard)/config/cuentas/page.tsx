import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { AccountManager } from "./account-manager";

export default async function CuentasPage() {
  const accounts = await db.select().from(account);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Cuentas</h2>
      <AccountManager accounts={accounts} />
    </div>
  );
}
