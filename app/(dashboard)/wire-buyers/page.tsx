import { db } from "@/lib/db";
import { wireBuyer, wireBuyerBalance } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { WireBuyersTable } from "./wire-buyers-table";

export const dynamic = "force-dynamic";

export default async function WireBuyersPage() {
  const rows = await db
    .select({ id: wireBuyer.id, name: wireBuyer.name, balanceCup: wireBuyerBalance.balanceCup, balanceUsd: wireBuyerBalance.balanceUsd })
    .from(wireBuyer)
    .leftJoin(wireBuyerBalance, eq(wireBuyerBalance.wireBuyerId, wireBuyer.id));

  return <WireBuyersTable rows={rows} />;
}
