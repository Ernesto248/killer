import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { AccountManager } from "./account-manager";

export default async function CuentasPage() {
  const accounts = await db.select().from(account);
  return (
    <div className="space-y-4">
      <AccountManager accounts={accounts} />
    </div>
  );
}
