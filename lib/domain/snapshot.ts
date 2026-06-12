import { db } from "@/lib/db";
import { remeseroBalance, wireBuyerBalance, dailySnapshot, config } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function computeDailySnapshot(date: Date) {
  const [tasaCfg] = await db.select().from(config).where(eq(config.key, "tasa_global"));
  const tasa = (tasaCfg?.value as { rate: number } | undefined)?.rate ?? 530;

  const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);

  const balances = await db.select().from(remeseroBalance);
  const buyerBalances = await db.select().from(wireBuyerBalance);

  const toUsd = (cup: number) => cup / tasa;
  const totalAFavor = balances.filter((b) => Number(b.balanceCup) > 0).reduce((a, b) => a + toUsd(Number(b.balanceCup)), 0)
    + buyerBalances.filter((b) => Number(b.balanceCup) < 0).reduce((a, b) => a + toUsd(Math.abs(Number(b.balanceCup))), 0);
  const totalDebo = balances.filter((b) => Number(b.balanceCup) < 0).reduce((a, b) => a + toUsd(Math.abs(Number(b.balanceCup))), 0)
    + buyerBalances.filter((b) => Number(b.balanceCup) > 0).reduce((a, b) => a + toUsd(Math.abs(Number(b.balanceCup))), 0);

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
