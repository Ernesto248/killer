"use server";
import { createExchange } from "@/lib/domain/exchange";
import { redirect } from "next/navigation";

export async function createExchangeAction(input: Parameters<typeof createExchange>[0]) {
  await createExchange(input);
  redirect("/tesoreria/movimiento");
}
