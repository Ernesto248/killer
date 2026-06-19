import "dotenv/config";
import { db } from "../lib/db";
import {
  remesero, cuadre, cuadreTirada, remeseroBalance, remeseroUsdMovement,
  wireBuyer, wireBuyerBalance, wire, wirePayment,
  currencyExchange, operationalExpense, config, account,
  zelleAccount, externalDebt, project,
} from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

const today = new Date();
const day = (d: number) => { const dt = new Date(today); dt.setDate(dt.getDate() - d); dt.setHours(12, 0, 0, 0); return dt; };

async function registrarCuadre(input: {
  remeseroName: string; date: Date; tirado?: Array<{ usd: number; tasa: number }>;
  balanceFinalCup: number; balanceFinalLabel: string;
}) {
  return db.transaction(async (tx) => {
    let [r] = await tx.select().from(remesero).where(eq(remesero.name, input.remeseroName));
    if (!r) [r] = await tx.insert(remesero).values({ name: input.remeseroName }).returning();

    const t = input.tirado ?? [];
    const [c] = await tx.insert(cuadre).values({
      remeseroId: r.id, date: input.date,
      balanceInicialCup: "0",
      pagadoCup: "0", pendientesUsd: "0",
      tiradoItems: t.map((x) => ({ usd: String(x.usd), tasa: String(x.tasa) })),
      balanceFinalCup: String(input.balanceFinalCup),
      balanceFinalLabel: input.balanceFinalLabel,
      rawText: "seed",
    }).returning();

    if (t.length > 0) {
      await tx.insert(cuadreTirada).values(t.map((x) => ({
        cuadreId: c.id, remeseroId: r.id, date: input.date,
        usd: String(x.usd), tasa: String(x.tasa), cupEquivalente: String(x.usd * x.tasa),
      })));
    }

    await tx.insert(remeseroBalance).values({
      remeseroId: r.id, balanceCup: String(input.balanceFinalCup), lastCuadreAt: input.date,
    }).onConflictDoUpdate({
      target: remeseroBalance.remeseroId,
      set: { balanceCup: String(input.balanceFinalCup), lastCuadreAt: input.date, updatedAt: new Date() },
    });
    return c.id;
  });
}

async function main() {
  console.log("🌱 Populating demo database...\n");

  // Tasa global
  await db.update(config).set({ value: { rate: 620 }, updatedAt: new Date() }).where(eq(config.key, "tasa_global"));

  // Set manual balances for physical accounts
  const accs = await db.select().from(account);
  const llc = accs.find((a) => a.type === "llc_usa")!;
  const cupF = accs.find((a) => a.type === "efectivo_cup")!;
  const usdF = accs.find((a) => a.type === "efectivo_usd")!;

  await db.update(account).set({ balanceManual: "8500000" }).where(eq(account.id, cupF.id));
  await db.update(account).set({ balanceManual: "15000" }).where(eq(account.id, usdF.id));
  console.log("Balances: CUP=8,500,000 | USD=15,000");

  // ============ CUADRES (more data) ============
  const cuadres = [
    { name: "Gea Zll", daysAgo: 1, tirado: [{ usd: 720, tasa: 575 }, { usd: 350, tasa: 540 }, { usd: 786, tasa: 585 }, { usd: 30, tasa: 590 }, { usd: 1949, tasa: 595 }, { usd: 3145, tasa: 600 }], final: 2555337, label: "deuda" },
    { name: "Gea Zll", daysAgo: 0, tirado: [{ usd: 500, tasa: 610 }, { usd: 300, tasa: 615 }], final: 3042300, label: "deuda" },
    { name: "Naidiel Zll", daysAgo: 1, tirado: [{ usd: 3756, tasa: 573 }, { usd: 223, tasa: 585 }, { usd: 2970, tasa: 587 }, { usd: 330, tasa: 595 }], final: 2049943, label: "deuda" },
    { name: "Naidiel Zll", daysAgo: 0, tirado: [{ usd: 1000, tasa: 590 }], final: 2639943, label: "deuda" },
    { name: "Yohan Remesero", daysAgo: 2, tirado: [{ usd: 150, tasa: 573 }, { usd: 2229, tasa: 575 }], final: 150582, label: "fondo" },
    { name: "Adrian", daysAgo: 3, tirado: [{ usd: 500, tasa: 590 }, { usd: 800, tasa: 595 }], final: 756500, label: "deuda" },
    { name: "Adrian", daysAgo: 0, tirado: [{ usd: 300, tasa: 600 }], final: 936500, label: "deuda" },
    { name: "Micho Zelle", daysAgo: 2, tirado: [{ usd: 1000, tasa: 585 }, { usd: 600, tasa: 590 }], final: 1466000, label: "deuda" },
    { name: "Bryan", daysAgo: 4, tirado: [{ usd: 2000, tasa: 600 }, { usd: 1500, tasa: 605 }], final: 2817500, label: "deuda" },
    { name: "Bryan", daysAgo: 0, tirado: [{ usd: 800, tasa: 610 }], final: 3305500, label: "deuda" },
    { name: "Arguilago", daysAgo: 5, tirado: [{ usd: 3500, tasa: 610 }], final: 2135000, label: "deuda" },
    { name: "Victor", daysAgo: 3, tirado: [{ usd: 4000, tasa: 600 }, { usd: 2000, tasa: 605 }], final: 9340000, label: "fondo" },
    { name: "Victor", daysAgo: 0, tirado: [{ usd: 1500, tasa: 615 }], final: 8420000, label: "fondo" },
    { name: "Luisi Entregas", daysAgo: 2, tirado: [{ usd: 2500, tasa: 595 }], final: 1487500, label: "deuda" },
    { name: "Luisi Entregas", daysAgo: 0, tirado: [{ usd: 1200, tasa: 605 }], final: 2213500, label: "deuda" },
    { name: "Yosvani", daysAgo: 5, tirado: [{ usd: 800, tasa: 600 }], final: 480000, label: "deuda" },
    { name: "Dany Hisoka", daysAgo: 3, tirado: [{ usd: 3000, tasa: 590 }], final: 1770000, label: "deuda" },
    { name: "Jessica", daysAgo: 4, tirado: [{ usd: 150, tasa: 580 }], final: 87000, label: "deuda" },
    { name: "Jesus", daysAgo: 1, tirado: [{ usd: 4000, tasa: 600 }, { usd: 2000, tasa: 610 }], final: 3620000, label: "deuda" },
    { name: "Jesus", daysAgo: 0, tirado: [{ usd: 1000, tasa: 620 }], final: 4240000, label: "deuda" },
    { name: "Mory", daysAgo: 2, tirado: [{ usd: 2000, tasa: 595 }], final: 1190000, label: "deuda" },
    { name: "Tedio", daysAgo: 6, tirado: [{ usd: 500, tasa: 585 }], final: 292500, label: "fondo" },
    { name: "Pupo", daysAgo: 3, tirado: [{ usd: 300, tasa: 590 }], final: 177000, label: "deuda" },
    { name: "Edymir", daysAgo: 5, tirado: [{ usd: 400, tasa: 595 }], final: 238000, label: "deuda" },
  ];

  for (const c of cuadres) {
    await registrarCuadre({
      remeseroName: c.name, date: day(c.daysAgo), tirado: c.tirado,
      balanceFinalCup: c.final, balanceFinalLabel: c.label,
    });
  }
  console.log(`  ${cuadres.length} cuadres (${new Set(cuadres.map((c) => c.name)).size} remeseros)`);

  // ============ USD MOVEMENTS ============
  const usdMoves = [
    { name: "Gea Zll", daysAgo: 3, amount: -150, note: "Préstamo a Gea" },
    { name: "Gea Zll", daysAgo: 1, amount: 100, note: "Gea devolvió parte" },
    { name: "Naidiel Zll", daysAgo: 2, amount: -200, note: "Préstamo" },
    { name: "Victor", daysAgo: 4, amount: -500, note: "Anticipo USD" },
    { name: "Victor", daysAgo: 1, amount: 200, note: "Devolvió parte" },
  ];
  for (const m of usdMoves) {
    const [r] = await db.select().from(remesero).where(eq(remesero.name, m.name));
    if (r) {
      await db.insert(remeseroUsdMovement).values({ remeseroId: r.id, date: day(m.daysAgo), amount: String(m.amount), note: m.note });
      await db.update(remeseroBalance).set({ balanceUsd: sql`${remeseroBalance.balanceUsd} + ${m.amount}`, updatedAt: new Date() }).where(eq(remeseroBalance.remeseroId, r.id));
    }
  }
  console.log(`  ${usdMoves.length} USD movements`);

  // ============ WIRES ============
  await db.insert(wireBuyer).values([
    { name: "Miguel" }, { name: "Leandro" }, { name: "Comprador X" }, { name: "Luis" }, { name: "Ernesto" },
  ]);

  const { createWire } = await import("../lib/domain/wire");
  const wires = [
    { buyer: "Miguel", daysAgo: 3, usd: 7000, tasa: 660, moneda: "CUP" as const, destino: cupF.id },
    { buyer: "Miguel", daysAgo: 0, usd: 3000, tasa: 665, moneda: "CUP" as const, destino: cupF.id },
    { buyer: "Leandro", daysAgo: 5, usd: 3500, tasa: 650, moneda: "CUP" as const, destino: cupF.id },
    { buyer: "Comprador X", daysAgo: 7, usd: 1500, tasa: 665, moneda: "CUP" as const, destino: cupF.id },
    { buyer: "Luis", daysAgo: 2, usd: 5000, tasa: 3, moneda: "USD" as const, destino: usdF.id },
    { buyer: "Ernesto", daysAgo: 1, usd: 2000, tasa: 660, moneda: "CUP" as const, destino: cupF.id },
  ];
  const wireIds: number[] = [];
  for (const w of wires) {
    const r = await createWire({ wireBuyerName: w.buyer, date: day(w.daysAgo), usdAmount: w.usd, tasa: w.tasa, monedaDestino: w.moneda, fromAccountId: llc.id, toAccountId: w.destino });
    wireIds.push(r.wireId);
  }
  console.log(`  ${wires.length} wires`);

  // Wire payments
  const payments = [
    { wireIdx: 0, daysAgo: 2, cup: 2000000 },
    { wireIdx: 0, daysAgo: 1, cup: 1500000 },
    { wireIdx: 1, daysAgo: 0, cup: 1000000 },
    { wireIdx: 2, daysAgo: 3, cup: 1000000 },
    { wireIdx: 5, daysAgo: 0, cup: 800000 },
  ];
  for (const p of payments) {
    const wid = wireIds[p.wireIdx];
    if (wid) {
      await db.insert(wirePayment).values({ wireId: wid, wireBuyerId: p.wireIdx + 1, date: day(p.daysAgo), cupAmount: String(p.cup), note: "Abono" });
      await db.update(wireBuyerBalance).set({ balanceCup: sql`${wireBuyerBalance.balanceCup} - ${p.cup}`, updatedAt: new Date() }).where(eq(wireBuyerBalance.wireBuyerId, p.wireIdx + 1));
    }
  }
  console.log(`  ${payments.length} wire payments`);

  // ============ EXCHANGES ============
  await db.insert(currencyExchange).values([
    { date: day(4), direction: "compra_usd", usdAmount: "5000", tasa: "620", cupAmount: "3100000", fromAccountId: 1, toAccountId: 1, note: "Compré 5K USD a 620" },
    { date: day(6), direction: "venta_usd", usdAmount: "2000", tasa: "630", cupAmount: "1260000", fromAccountId: 1, toAccountId: 1, note: "Vendí 2K USD a 630" },
    { date: day(1), direction: "compra_usd", usdAmount: "3000", tasa: "625", cupAmount: "1875000", fromAccountId: 1, toAccountId: 1, note: "Compré 3K USD" },
  ]);
  console.log("  3 exchanges");

  // ============ GASTOS ============
  const gastos = [
    { daysAgo: 1, catId: 1, desc: "Gasolina semanal", cup: "3500", usd: "0" },
    { daysAgo: 2, catId: 3, desc: "Salario ayudante", cup: "150000", usd: "0" },
    { daysAgo: 3, catId: 2, desc: "Taxi gestiones", cup: "2500", usd: "0" },
    { daysAgo: 4, catId: 4, desc: "Almuerzo equipo", cup: "8500", usd: "0" },
    { daysAgo: 5, catId: 5, desc: "Internet mensual", cup: "0", usd: "60" },
    { daysAgo: 1, catId: 1, desc: "Gasolina extra", cup: "2800", usd: "0" },
    { daysAgo: 3, catId: 6, desc: "Papelería", cup: "1200", usd: "0" },
    { daysAgo: 7, catId: 2, desc: "Transporte provincia", cup: "4500", usd: "0" },
    { daysAgo: 0, catId: 5, desc: "Recarga móvil", usd: "10", cup: "0" },
    { daysAgo: 6, catId: 4, desc: "Comida reunión", cup: "6500", usd: "0" },
  ];
  for (const g of gastos) {
    await db.insert(operationalExpense).values({ date: day(g.daysAgo), categoryId: g.catId, description: g.desc, cupAmount: g.cup, usdAmount: g.usd });
  }
  console.log(`  ${gastos.length} gastos`);

  // ============ ZELLE ACCOUNTS ============
  await db.insert(zelleAccount).values([
    { name: "Wells Fargo LLC", bank: "Wells Fargo", balanceUsd: "8500" },
    { name: "Chase LLC", bank: "Chase", balanceUsd: "4300" },
    { name: "Bank of America", bank: "BoA", balanceUsd: "2200" },
  ]);
  console.log("  3 cuentas Zelle");

  // ============ EXTERNAL DEBTS ============
  await db.insert(externalDebt).values([
    { name: "Préstamo auto", amount: "5000", currency: "USD", direction: "debo", notes: "Pagar en 6 meses" },
    { name: "Carlos (amigo)", amount: "200", currency: "USD", direction: "me_deben", notes: "Me debe desde enero" },
    { name: "Préstamo familiar", amount: "150000", currency: "CUP", direction: "debo", notes: "Sin interés" },
    { name: "Alquiler local", amount: "50000", currency: "CUP", direction: "debo", notes: "Pago mensual atrasado" },
    { name: "Venta teléfono", amount: "300", currency: "USD", direction: "me_deben", notes: null },
  ]);
  console.log("  5 deudas externas");

  await db.insert(project).values([
    { name: "Inversión local", amount: "3000", currency: "USD", direction: "debo", notes: "Abrir nuevo punto" },
    { name: "Venta acciones", amount: "500", currency: "USD", direction: "me_deben", notes: null },
    { name: "Remodelación oficina", amount: "200000", currency: "CUP", direction: "debo", notes: "Pintura y muebles" },
    { name: "Consultoría", amount: "100", currency: "USD", direction: "me_deben", notes: "Pago pendiente" },
  ]);
  console.log("  4 proyectos");

  // Summary
  const rCount = await db.$count(remesero);
  const cCount = await db.$count(cuadre);
  const wCount = await db.$count(wire);
  const zCount = await db.$count(zelleAccount);
  const dCount = await db.$count(externalDebt);
  console.log(`\n✅ Done:`);
  console.log(`  ${rCount} remeseros, ${cCount} cuadres, ${wCount} wires`);
  console.log(`  ${zCount} cuentas Zelle, ${dCount} deudas externas`);
  console.log(`  ${gastos.length} gastos, ${usdMoves.length} USD moves, ${wires.length} exchanges\n`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
