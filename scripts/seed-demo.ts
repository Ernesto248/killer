import "dotenv/config";
import { db } from "../lib/db";
import {
  remesero, cuadre, cuadreTirada, remeseroBalance, remeseroUsdMovement,
  wireBuyer, wireBuyerBalance, wire, wireSplit, wirePayment,
  currencyExchange, operationalExpense, config, account, accountMovement,
} from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

const today = new Date();
const day = (d: number) => { const dt = new Date(today); dt.setDate(dt.getDate() - d); dt.setHours(12,0,0,0); return dt; };

async function registrarCuadreRaw(input: {
  remeseroName: string; date: Date; balanceInicialCup: number; pagadoCup: number;
  tirado: Array<{ usd: number; tasa: number }>; balanceFinalCup: number; balanceFinalLabel: string; rawText: string;
}) {
  return db.transaction(async (tx) => {
    let [r] = await tx.select().from(remesero).where(eq(remesero.name, input.remeseroName));
    if (!r) [r] = await tx.insert(remesero).values({ name: input.remeseroName }).returning();

    const [c] = await tx.insert(cuadre).values({
      remeseroId: r.id, date: input.date,
      balanceInicialCup: String(input.balanceInicialCup),
      pagadoCup: String(input.pagadoCup),
      pendientesUsd: "0",
      tiradoItems: input.tirado.map((t) => ({ usd: String(t.usd), tasa: String(t.tasa) })),
      balanceFinalCup: String(input.balanceFinalCup),
      balanceFinalLabel: input.balanceFinalLabel,
      rawText: input.rawText,
    }).returning();

    await tx.insert(cuadreTirada).values(input.tirado.map((t) => ({
      cuadreId: c.id, remeseroId: r.id, date: input.date,
      usd: String(t.usd), tasa: String(t.tasa), cupEquivalente: String(t.usd * t.tasa),
    })));

    await tx.insert(remeseroBalance).values({
      remeseroId: r.id,
      balanceCup: String(input.balanceFinalCup),
      lastCuadreAt: input.date,
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: { balanceCup: String(input.balanceFinalCup), lastCuadreAt: input.date, updatedAt: new Date() },
    });

    const [cupAcc] = await tx.select().from(account).where(eq(account.type, "efectivo_cup"));
    if (cupAcc && input.pagadoCup > 0) {
      await tx.insert(accountMovement).values({
        accountId: cupAcc.id, date: input.date, amount: String(-input.pagadoCup),
        currency: "CUP", refType: "cuadre", refId: c.id, note: `Pago a ${input.remeseroName}`,
      });
    }
    return c.id;
  });
}

async function main() {
  console.log("Seeding demo data...");

  // Accounts
  const accs = await db.select().from(account);
  const llc = accs.find((a) => a.type === "llc_usa")!;
  const cupF = accs.find((a) => a.type === "efectivo_cup")!;
  const usdF = accs.find((a) => a.type === "efectivo_usd")!;

  // Tasa
  await db.update(config).set({ value: { rate: 600 }, updatedAt: new Date() }).where(eq(config.key, "tasa_global"));

  // --- CUADRES ---
  await registrarCuadreRaw({ remeseroName: "Gea Zll", date: day(1), balanceInicialCup: 408172, pagadoCup: 1980000, tirado: [{ usd: 720, tasa: 575 }, { usd: 350, tasa: 540 }, { usd: 786, tasa: 585 }, { usd: 30, tasa: 590 }, { usd: 1949, tasa: 595 }, { usd: 3145, tasa: 600 }], balanceFinalCup: 2555337, balanceFinalLabel: "deuda", rawText: "demo" });
  await registrarCuadreRaw({ remeseroName: "Naidiel Zll", date: day(1), balanceInicialCup: 2827560, pagadoCup: 5000000, tirado: [{ usd: 3756, tasa: 573 }, { usd: 223, tasa: 585 }, { usd: 2970, tasa: 587 }, { usd: 330, tasa: 595 }], balanceFinalCup: 2049943, balanceFinalLabel: "deuda", rawText: "demo" });
  await registrarCuadreRaw({ remeseroName: "Yohan Remesero", date: day(2), balanceInicialCup: 101793, pagadoCup: 1620000, tirado: [{ usd: 150, tasa: 573 }, { usd: 2229, tasa: 575 }], balanceFinalCup: 150582, balanceFinalLabel: "fondo", rawText: "demo" });
  await registrarCuadreRaw({ remeseroName: "Adrian", date: day(3), balanceInicialCup: 0, pagadoCup: 0, tirado: [{ usd: 500, tasa: 590 }, { usd: 800, tasa: 595 }], balanceFinalCup: 756500, balanceFinalLabel: "deuda", rawText: "demo" });
  await registrarCuadreRaw({ remeseroName: "Micho Zelle", date: day(2), balanceInicialCup: 880000, pagadoCup: 1200000, tirado: [{ usd: 1000, tasa: 585 }, { usd: 600, tasa: 590 }], balanceFinalCup: 1466000, balanceFinalLabel: "deuda", rawText: "demo" });
  await registrarCuadreRaw({ remeseroName: "Bryan", date: day(4), balanceInicialCup: 1200000, pagadoCup: 800000, tirado: [{ usd: 2000, tasa: 600 }, { usd: 1500, tasa: 605 }], balanceFinalCup: 2817500, balanceFinalLabel: "deuda", rawText: "demo" });
  await registrarCuadreRaw({ remeseroName: "Arguilago", date: day(5), balanceInicialCup: 0, pagadoCup: 500000, tirado: [{ usd: 3500, tasa: 610 }], balanceFinalCup: 2135000, balanceFinalLabel: "deuda", rawText: "demo" });
  await registrarCuadreRaw({ remeseroName: "Victor", date: day(3), balanceInicialCup: 5000000, pagadoCup: 18000000, tirado: [{ usd: 4000, tasa: 600 }, { usd: 2000, tasa: 605 }], balanceFinalCup: 9340000, balanceFinalLabel: "fondo", rawText: "demo" });

  console.log("  8 cuadres creados");

  // --- USD movements ---
  const [gea] = await db.select().from(remesero).where(eq(remesero.name, "Gea Zll"));
  await db.insert(remeseroUsdMovement).values({ remeseroId: gea.id, date: day(3), amount: "-150", note: "Préstamo a Gea" });
  await db.update(remeseroBalance).set({ balanceUsd: sql`${remeseroBalance.balanceUsd} - 150`, updatedAt: new Date() }).where(eq(remeseroBalance.remeseroId, gea.id));
  await db.insert(remeseroUsdMovement).values({ remeseroId: gea.id, date: day(5), amount: "150", note: "Gea devolvió" });
  await db.update(remeseroBalance).set({ balanceUsd: sql`${remeseroBalance.balanceUsd} + 150`, updatedAt: new Date() }).where(eq(remeseroBalance.remeseroId, gea.id));

  // --- Wire buyers ---
  await db.insert(wireBuyer).values([{ name: "Miguel" }, { name: "Leandro" }, { name: "Comprador X" }]);

  // --- Wires (FIFO - consume cuadre_tiradas) ---
  const { createWire } = await import("../lib/domain/wire");
  const w1 = await createWire({ wireBuyerName: "Miguel", date: day(3), usdAmount: 7000, tasa: 660, monedaDestino: "CUP", fromAccountId: llc.id, toAccountId: cupF.id, nota: "Wire grande a Miguel" });
  console.log(`  Wire #${w1.wireId}: 7,000 USD, ganancia ${Math.round(w1.ganancia)} CUP`);

  const w2 = await createWire({ wireBuyerName: "Leandro", date: day(5), usdAmount: 3500, tasa: 650, monedaDestino: "CUP", fromAccountId: llc.id, toAccountId: cupF.id, nota: "Wire a Leandro" });
  console.log(`  Wire #${w2.wireId}: 3,500 USD, ganancia ${Math.round(w2.ganancia)} CUP`);

  const w3 = await createWire({ wireBuyerName: "Comprador X", date: day(7), usdAmount: 1500, tasa: 665, monedaDestino: "CUP", fromAccountId: llc.id, toAccountId: cupF.id, nota: "Wire chico" });
  console.log(`  Wire #${w3.wireId}: 1,500 USD, ganancia ${Math.round(w3.ganancia)} CUP`);

  // --- Wire payments ---
  await db.insert(wirePayment).values({ wireId: w1.wireId, wireBuyerId: 1, date: day(2), cupAmount: "2000000", note: "Primer abono" });
  await db.update(wireBuyerBalance).set({ balanceCup: sql`${wireBuyerBalance.balanceCup} - 2000000`, updatedAt: new Date() }).where(eq(wireBuyerBalance.wireBuyerId, 1));
  await db.insert(wirePayment).values({ wireId: w1.wireId, wireBuyerId: 1, date: day(1), cupAmount: "1500000", note: "Segundo abono" });
  await db.update(wireBuyerBalance).set({ balanceCup: sql`${wireBuyerBalance.balanceCup} - 1500000`, updatedAt: new Date() }).where(eq(wireBuyerBalance.wireBuyerId, 1));

  // --- Currency exchanges ---
  await db.insert(currencyExchange).values({ date: day(4), direction: "compra_usd", usdAmount: "5000", tasa: "620", cupAmount: "3100000", fromAccountId: cupF.id, toAccountId: usdF.id, note: "Compré 5K USD" });
  await db.insert(accountMovement).values({ accountId: cupF.id, date: day(4), amount: "-3100000", currency: "CUP", refType: "exchange", refId: 1 });
  await db.insert(accountMovement).values({ accountId: usdF.id, date: day(4), amount: "5000", currency: "USD", refType: "exchange", refId: 1 });
  await db.insert(currencyExchange).values({ date: day(6), direction: "venta_usd", usdAmount: "2000", tasa: "630", cupAmount: "1260000", fromAccountId: usdF.id, toAccountId: cupF.id, note: "Vendí 2K USD" });
  await db.insert(accountMovement).values({ accountId: usdF.id, date: day(6), amount: "-2000", currency: "USD", refType: "exchange", refId: 2 });
  await db.insert(accountMovement).values({ accountId: cupF.id, date: day(6), amount: "1260000", currency: "CUP", refType: "exchange", refId: 2 });

  // --- Gastos ---
  await db.insert(operationalExpense).values({ date: day(1), categoryId: 1, description: "Gasolina semanal", cupAmount: "3500", usdAmount: "0", fromAccountId: cupF.id });
  await db.insert(operationalExpense).values({ date: day(2), categoryId: 3, description: "Salario ayudante", cupAmount: "150000", usdAmount: "0", fromAccountId: cupF.id });
  await db.insert(operationalExpense).values({ date: day(3), categoryId: 2, description: "Taxi gestiones", cupAmount: "2500", usdAmount: "0", fromAccountId: cupF.id });
  await db.insert(operationalExpense).values({ date: day(4), categoryId: 4, description: "Almuerzo equipo", cupAmount: "8500", usdAmount: "0", fromAccountId: cupF.id });
  await db.insert(operationalExpense).values({ date: day(5), categoryId: 5, description: "Internet mensual", cupAmount: "0", usdAmount: "60", fromAccountId: usdF.id });

  // Expense account movements
  await db.insert(accountMovement).values({ accountId: cupF.id, date: day(1), amount: "-3500", currency: "CUP", refType: "expense", refId: 1, note: "Gasolina" });
  await db.insert(accountMovement).values({ accountId: cupF.id, date: day(2), amount: "-150000", currency: "CUP", refType: "expense", refId: 2, note: "Salario" });
  await db.insert(accountMovement).values({ accountId: cupF.id, date: day(3), amount: "-2500", currency: "CUP", refType: "expense", refId: 3, note: "Taxi" });
  await db.insert(accountMovement).values({ accountId: cupF.id, date: day(4), amount: "-8500", currency: "CUP", refType: "expense", refId: 4, note: "Almuerzo" });
  await db.insert(accountMovement).values({ accountId: usdF.id, date: day(5), amount: "-60", currency: "USD", refType: "expense", refId: 5, note: "Internet" });

  // --- Snapshot ---
  const { computeDailySnapshot } = await import("../lib/domain/snapshot");
  await computeDailySnapshot(today);

  // Summary
  const rCount = await db.$count(remesero);
  const cCount = await db.$count(cuadre);
  const wCount = await db.$count(wire);
  console.log(`\nDone:`);
  console.log(`  ${rCount} remeseros, ${cCount} cuadres, ${wCount} wires, 5 gastos, 2 exchanges, 3 wire buyers\n`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
