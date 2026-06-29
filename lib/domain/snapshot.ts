import { db } from "@/lib/db";
import { remeseroBalance, dailySnapshot, config, wireItem } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function computeDailySnapshot(date: Date) {
  const [tasaCfg] = await db.select().from(config).where(eq(config.key, "tasa_global"));
  const tasa = (tasaCfg?.value as { rate: number } | undefined)?.rate ?? 530;

  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);

  const balances = await db.select().from(remeseroBalance);
  const wires = await db.select().from(wireItem).where(eq(wireItem.isActive, true));

  const toUsd = (cup: number) => cup / tasa;
  const wireAFavor = wires.filter((w) => w.direction === "me_deben").reduce((a, w) => {
    const amount = Number(w.amount ?? 0);
    return a + (w.currency === "CUP" ? toUsd(amount) : amount);
  }, 0);
  const wireDebo = wires.filter((w) => w.direction === "debo").reduce((a, w) => {
    const amount = Number(w.amount ?? 0);
    return a + (w.currency === "CUP" ? toUsd(amount) : amount);
  }, 0);
  const totalAFavor = balances.filter((b) => Number(b.balanceCup) > 0).reduce((a, b) => a + toUsd(Number(b.balanceCup)), 0)
    + wireAFavor;
  const totalDebo = balances.filter((b) => Number(b.balanceCup) < 0).reduce((a, b) => a + toUsd(Math.abs(Number(b.balanceCup))), 0)
    + wireDebo;

  const capitalNeto = totalAFavor - totalDebo;

  await db.insert(dailySnapshot).values({
    date: startOfDay,
    capitalNetoUsd: String(capitalNeto),
    totalAFavorUsd: String(totalAFavor),
    totalDeboUsd: String(totalDebo),
    tasaGlobalCup: String(tasa),
  }).onConflictDoUpdate({
    target: dailySnapshot.date,
    set: {
      capitalNetoUsd: String(capitalNeto),
      totalAFavorUsd: String(totalAFavor),
      totalDeboUsd: String(totalDebo),
      tasaGlobalCup: String(tasa),
      computedAt: new Date(),
    },
  });

  return { capitalNeto, totalAFavor, totalDebo };
}
