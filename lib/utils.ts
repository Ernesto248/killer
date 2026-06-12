import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency?: string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (currency === "USD") return `$${n.toLocaleString()}`;
  if (currency === "CUP") return `${n.toLocaleString()} CUP`;
  return n.toLocaleString();
}
