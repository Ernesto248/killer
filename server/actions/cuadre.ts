"use server";
import { registrarCuadre } from "@/lib/domain/cuadre";
import { revalidatePath } from "next/cache";

export async function createCuadreAction(input: Parameters<typeof registrarCuadre>[0]) {
  const result = await registrarCuadre(input);
  revalidatePath("/remeseros");
  revalidatePath("/");
  return result;
}
