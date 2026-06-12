import { db } from "./index";
import { account, category, config } from "./schema";

async function seed() {
  console.log("Seeding...");

  await db.delete(category);
  await db.delete(account);
  await db.delete(config);

  await db.insert(account).values([
    { name: "LLC USA", type: "llc_usa", currency: "USD" },
    { name: "CUP Fisico", type: "efectivo_cup", currency: "CUP" },
    { name: "USD Fisico", type: "efectivo_usd", currency: "USD" },
  ]);

  await db.insert(category).values([
    { name: "Gasolina" },
    { name: "Transporte" },
    { name: "Salarios" },
    { name: "Comida" },
    { name: "Servicios" },
    { name: "Otros" },
  ]);

  await db.insert(config).values({ key: "tasa_global", value: { rate: 530 } });

  console.log("Seeded.");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
