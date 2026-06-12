import "dotenv/config";
import { db } from "../lib/db";
import { dailySnapshot } from "../lib/db/schema";

async function main() {
  console.log("Populating daily snapshots...");
  const base = 180000;
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const progress = 1 - i / 30;
    const capitalNeto = Math.round(base + progress * 40000 + (Math.random() - 0.5) * 6000);
    const totalAFavor = Math.round(capitalNeto * 0.65 + Math.random() * 10000);
    const totalDebo = Math.round(capitalNeto * 0.35 + Math.random() * 5000);
    const tasa = Math.round(580 + progress * 30 + (Math.random() - 0.5) * 20);

    await db.insert(dailySnapshot).values({
      date: d,
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
  }

  console.log("Done — 31 snapshots inserted");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
