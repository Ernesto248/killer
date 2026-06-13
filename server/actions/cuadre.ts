"use server";
import { registrarCuadre } from "@/lib/domain/cuadre";
import { redirect } from "next/navigation";

export async function createCuadreAction(input: Parameters<typeof registrarCuadre>[0]) {
  const result = await registrarCuadre(input);
  redirect("/remeseros");
  return result;
}
