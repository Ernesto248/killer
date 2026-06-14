import { db } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { GastoForm } from "./gasto-form";

export const dynamic = "force-dynamic";

export default async function NuevoGastoPage() {
  const cats = await db.select().from(category).where(eq(category.isActive, true));
  return <GastoForm categories={cats} />;
}
