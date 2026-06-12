import { z } from "zod";

export const tasaGlobalSchema = z.object({ rate: z.number().positive() });
