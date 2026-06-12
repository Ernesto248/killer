import { z } from "zod";

export const accountInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["llc_usa", "efectivo_cup", "efectivo_usd"]),
  currency: z.enum(["USD", "CUP"]),
});

export type AccountInput = z.infer<typeof accountInputSchema>;
