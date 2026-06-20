import "dotenv/config";
import { db } from "../lib/db";
import {
  remesero, remeseroBalance, cuadre, cuadreTirada, remeseroUsdMovement,
  wireBuyer, wireBuyerBalance, wire, wirePayment, wireSplit,
  currencyExchange, operationalExpense, accountMovement,
  zelleAccount, externalDebt, project, snapshotHistory,
  account, category, config, dailySnapshot, alert,
} from "../lib/db/schema";

async function main() {
  console.log("🧹 Limpiando toda la base de datos...");

  // Delete ALL data in reverse dependency order
  await db.delete(snapshotHistory);
  await db.delete(alert);
  await db.delete(dailySnapshot);
  await db.delete(accountMovement);
  await db.delete(wirePayment);
  await db.delete(wireSplit);
  await db.delete(wire);
  await db.delete(wireBuyerBalance);
  await db.delete(wireBuyer);

  await db.delete(currencyExchange);
  await db.delete(operationalExpense);

  await db.delete(cuadreTirada);
  await db.delete(cuadre);
  await db.delete(remeseroUsdMovement);
  await db.delete(remeseroBalance);
  await db.delete(remesero);

  await db.delete(externalDebt);
  await db.delete(project);
  await db.delete(zelleAccount);

  await db.delete(account);
  await db.delete(category);
  await db.delete(config);

  console.log("✅ Todo eliminado.");

  // Re-create seed accounts
  console.log("🌱 Insertando datos iniciales...");
  await db.insert(account).values([
    { name: "LLC USA", type: "llc_usa", currency: "USD", balanceManual: "0" },
    { name: "CUP Fisico", type: "efectivo_cup", currency: "CUP", balanceManual: "0" },
    { name: "USD Fisico", type: "efectivo_usd", currency: "USD", balanceManual: "0" },
  ]);

  await db.insert(category).values([
    { name: "Gasolina" },
    { name: "Transporte" },
    { name: "Salarios" },
    { name: "Comida" },
    { name: "Servicios" },
    { name: "Otros" },
  ]);

  await db.insert(config).values({ key: "tasa_global", value: { rate: 600 } });

  // Insert all remeseros from Excel "Cuadre 11-4-26.ods" — Sheet "Actual"
  const remeseroNames = [
    "Jose",
    "Adrian",
    "Micho zelle",
    "Micho wire",
    "Elizabeth",
    "Luisi Entregas",
    "Luisi Remesas",
    "Gea",
    "Mama",
    "Papa",
    "Francisco",
    "Yosvani",
    "Arguilago",
    "Victor",
    "enmanuel",
    "Yonky",
    "Dany hisoka yuma",
    "Hisoka",
    "Jessica",
    "Alber",
    "Odelio",
    "Edymir",
    "Dennys",
    "Pupo",
    "Giorgue",
    "Jesus",
    "wire gea",
    "wire q debo a leandro",
    "Migue",
    "Leo Gamboa",
    "Dova",
    "ailed",
    "deuda luisi",
    "Ernesto Wire",
    "Joge",
    "Bryan",
    "Mory",
    "Tedio",
    "bryan cis",
  ];

  for (const name of remeseroNames) {
    const [r] = await db.insert(remesero).values({ name }).returning();
    await db.insert(remeseroBalance).values({
      remeseroId: r.id,
      balanceCup: "0",
      balanceUsd: "0",
    });
  }

  console.log(`  ${remeseroNames.length} remeseros insertados (balances en 0)`);
  console.log("✅ Listo para producción.\n");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
