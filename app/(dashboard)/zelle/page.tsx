import { db } from "@/lib/db";
import { zelleAccount } from "@/lib/db/schema";
import { ZelleManager } from "./zelle-manager";

export const dynamic = "force-dynamic";

export default async function ZellePage() {
  const accounts = await db.select().from(zelleAccount);
  return <ZelleManager accounts={accounts} />;
}
