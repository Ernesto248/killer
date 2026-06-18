"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cuadre, cuadreTirada, remeseroBalance } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { registrarCuadre } from "@/lib/domain/cuadre";

export async function createCuadreAction(input: Parameters<typeof registrarCuadre>[0]) {
  const result = await registrarCuadre(input);
  redirect("/remeseros");
  return result;
}

export async function revertCuadreAction(cuadreId: number) {
  await db.transaction(async (tx) => {
    const [c] = await tx.select().from(cuadre).where(eq(cuadre.id, cuadreId));
    if (!c) throw new Error("Cuadre no encontrado");

    await tx.delete(cuadreTirada).where(eq(cuadreTirada.cuadreId, cuadreId));

    const [prev] = await tx.select().from(cuadre)
      .where(eq(cuadre.remeseroId, c.remeseroId))
      .orderBy(desc(cuadre.date))
      .limit(1)
      .offset(1);

    if (prev) {
      await tx.update(remeseroBalance)
        .set({ balanceCup: prev.balanceFinalCup, lastCuadreAt: prev.date, updatedAt: new Date() })
        .where(eq(remeseroBalance.remeseroId, c.remeseroId));
    } else {
      await tx.delete(remeseroBalance).where(eq(remeseroBalance.remeseroId, c.remeseroId));
    }

    await tx.delete(cuadre).where(eq(cuadre.id, cuadreId));
  });
  revalidatePath("/remeseros");
  redirect("/cuadres");
}
