import { db } from "@/lib/db";
import { remesero, cuadre, remeseroBalance, remeseroUsdMovement } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FichaClient } from "./ficha-client";

export default async function RemeseroFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const remeseroId = Number(id);
  const [r] = await db.select().from(remesero).where(eq(remesero.id, remeseroId));
  if (!r) notFound();

  const [balance] = await db.select().from(remeseroBalance).where(eq(remeseroBalance.remeseroId, remeseroId));
  const cuadres = await db.select().from(cuadre).where(eq(cuadre.remeseroId, remeseroId)).orderBy(desc(cuadre.date));
  const usdMovs = await db.select().from(remeseroUsdMovement).where(eq(remeseroUsdMovement.remeseroId, remeseroId)).orderBy(desc(remeseroUsdMovement.date));

  return <FichaClient remesero={r} balance={balance ?? null} cuadres={cuadres} usdMovs={usdMovs} />;
}
