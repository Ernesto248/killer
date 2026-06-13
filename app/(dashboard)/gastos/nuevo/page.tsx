import { db } from "@/lib/db";
import { category, account } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";
import { GastoForm } from "./gasto-form";

export default async function NuevoGastoPage() {
  const [cats, accts] = await Promise.all([
    db.select().from(category).where(eq(category.isActive, true)),
    db.select().from(account),
  ]);
  return (
    <div className="space-y-4">
      <GastoForm categories={cats} accounts={accts} />
    </div>
  );
}
