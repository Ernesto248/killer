"use server";
import { createExchange } from "@/lib/domain/exchange";
import { revalidatePath } from "next/cache";

export async function createExchangeAction(input: Parameters<typeof createExchange>[0]) {
  const r = await createExchange(input);
  revalidatePath("/tesoreria/movimiento");
  return r;
}
