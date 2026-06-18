import { db } from "@/lib/db";
import { externalDebt } from "@/lib/db/schema";
import { DeudasManager } from "./deudas-manager";

export const dynamic = "force-dynamic";

export default async function DeudasPage() {
  const debts = await db.select().from(externalDebt);
  return <DeudasManager debts={debts} />;
}
