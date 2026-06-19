import { db } from "@/lib/db";
import { account, remeseroBalance, wireBuyerBalance, cuadre, zelleAccount, externalDebt, project, config } from "@/lib/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { fetchTasas } from "@/lib/fetch-tasas";
import { cn } from "@/lib/utils";
import { EditableBalance } from "./editable-balance";
import { ExternalDebtsSection } from "./external-debts-section";
import { ElToqueSection } from "./eltoque-section";
import { ProjectsSection } from "./projects-section";
import { SaveSnapshotButton } from "./save-snapshot-button";

export const dynamic = "force-dynamic";

function fmt(n: number) { return n.toLocaleString("es-ES", { useGrouping: true }); }

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ showDebts?: string }> }) {
  const sp = await searchParams;
  const showDebts = sp.showDebts === "1";

  const [accs, rBalances, wBalances, labels, zelles, debts, projects, tasas, tasaCfg] = await Promise.all([
    db.select().from(account),
    db.select().from(remeseroBalance),
    db.select().from(wireBuyerBalance),
    db.select({ remeseroId: cuadre.remeseroId, label: cuadre.balanceFinalLabel }).from(cuadre).orderBy(desc(cuadre.date)),
    db.select().from(zelleAccount).where(eq(zelleAccount.isActive, true)),
    db.select().from(externalDebt).where(eq(externalDebt.isActive, true)),
    db.select().from(project).where(eq(project.isActive, true)),
    fetchTasas(),
    db.select().from(config).where(eq(config.key, "tasa_global")).then((r) => r[0] ?? null),
  ]);

  const tasaGlobal = (tasaCfg?.value as { rate: number })?.rate ?? 600;

  // Physical accounts
  const cupAcc = accs.find((a) => a.type === "efectivo_cup");
  const usdAcc = accs.find((a) => a.type === "efectivo_usd");
  const cupFisico = Number(cupAcc?.balanceManual ?? 0);
  const usdFisico = Number(usdAcc?.balanceManual ?? 0);

  // Remesero labels
  const labelMap = new Map<number, string>();
  for (const l of labels) { if (!labelMap.has(l.remeseroId)) labelMap.set(l.remeseroId, l.label ?? ""); }

  let remFondo = 0; let remDeuda = 0;
  for (const rb of rBalances) {
    const cup = Number(rb.balanceCup ?? 0);
    if (labelMap.get(rb.remeseroId) === "fondo") remFondo += cup;
    else if (labelMap.get(rb.remeseroId) === "deuda") remDeuda += cup;
  }
  const remeserosCup = remFondo - remDeuda;

  let remNosDebenUsd = 0; let remDebemosUsd = 0;
  for (const rb of rBalances) {
    const usd = Number(rb.balanceUsd ?? 0);
    if (usd > 0) remDebemosUsd += usd;
    else remNosDebenUsd += Math.abs(usd);
  }
  const remeserosUsd = remNosDebenUsd - remDebemosUsd;

  // Wire balances
  let wireCup = 0; let wireUsd = 0;
  for (const wb of wBalances) { wireCup += Number(wb.balanceCup ?? 0); wireUsd += Number(wb.balanceUsd ?? 0); }

  // Zelle
  let zelleTotal = 0;
  for (const z of zelles) { zelleTotal += Number(z.balanceUsd ?? 0); }

  // External debts
  let extDebenCup = 0; let extDeboCup = 0; let extDebenUsd = 0; let extDeboUsd = 0;
  for (const d of debts) {
    const amt = Number(d.amount ?? 0);
    if (d.direction === "me_deben") {
      if (d.currency === "CUP") extDebenCup += amt;
      else extDebenUsd += amt;
    } else {
      if (d.currency === "CUP") extDeboCup += amt;
      else extDeboUsd += amt;
    }
  }

  // Projects
  let proyDebenCup = 0; let proyDeboCup = 0; let proyDebenUsd = 0; let proyDeboUsd = 0;
  for (const p of projects) {
    const amt = Number(p.amount ?? 0);
    if (p.direction === "me_deben") {
      if (p.currency === "CUP") proyDebenCup += amt;
      else proyDebenUsd += amt;
    } else {
      if (p.currency === "CUP") proyDeboCup += amt;
      else proyDeboUsd += amt;
    }
  }

  // Ganancia in USD
  const toUsd = (cup: number) => cup / tasaGlobal;
  const ganancia = toUsd(cupFisico + extDebenCup + proyDebenCup - remDeuda - wireCup - extDeboCup - proyDeboCup)
    + (usdFisico + zelleTotal + extDebenUsd + proyDebenUsd - remDebemosUsd - wireUsd - extDeboUsd - proyDeboUsd);

  const kpiCards = [
    { label: "CUP Físico", value: cupFisico, suffix: "CUP", accountId: cupAcc?.id },
    { label: "USD Físico", value: usdFisico, suffix: "USD", accountId: usdAcc?.id },
    { label: "Tasa Global", value: tasaGlobal, suffix: "CUP/USD", isTasa: true },
  ];

  const debtCards = [
    { label: "Remeseros CUP", value: remeserosCup, suffix: "CUP" },
    { label: "Remeseros USD", value: remeserosUsd, suffix: "USD" },
    { label: "Wires pend. CUP", value: wireCup, suffix: "CUP" },
    { label: "Wires pend. USD", value: wireUsd, suffix: "USD" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SaveSnapshotButton data={{
          cupFisico, usdFisico, tasaGlobal,
          remeserosCup, remeserosUsd, wiresCup, wiresUsd, zelleTotal,
          extDebenCup, extDeboCup, extDebenUsd, extDeboUsd,
          proyDebenCup, proyDeboCup, proyDebenUsd, proyDeboUsd,
          ganancia: Math.round(ganancia),
        }} />
      </div>

      {/* Section 1: Fisico + Tasa */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {kpiCards.map((c) => (
          <EditableBalance key={c.label} label={c.label} value={c.value} suffix={c.suffix}
            accountId={c.accountId} isTasa={c.isTasa} />
        ))}
      </div>

      {/* Section 2: Remeseros + Wires */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {debtCards.map((c) => (
          <div key={c.label} className={cn("card-apple p-4", c.value >= 0 ? "bg-green-50/40" : "bg-red-50/40")}>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</div>
            <div className={cn("text-lg sm:text-2xl tabular-nums font-semibold mt-1", c.value >= 0 ? "text-green-600" : "text-red-600")}>
              {c.value >= 0 ? "+" : ""}{fmt(c.value)} {c.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* Section 3: Zelle */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Cuentas Zelle</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {zelles.map((z) => (
            <EditableBalance key={z.id} label={z.name} value={Number(z.balanceUsd ?? 0)} suffix="USD" zelleId={z.id} />
          ))}
          <Link href="/zelle" className="card-apple p-4 flex items-center justify-center min-h-[80px] border-dashed text-muted-foreground text-xs hover:text-foreground transition-colors">
            + Nueva cuenta
          </Link>
        </div>
      </div>

      {/* Section 4: Deudas externas */}
      <ExternalDebtsSection debts={debts} showDebts={showDebts} extDebenCup={extDebenCup} extDeboCup={extDeboCup} extDebenUsd={extDebenUsd} extDeboUsd={extDeboUsd} />

      {/* Section 4.5: Proyectos */}
      <ProjectsSection projects={projects} proyDebenCup={proyDebenCup} proyDeboCup={proyDeboCup} proyDebenUsd={proyDebenUsd} proyDeboUsd={proyDeboUsd} />

      {/* Section 5: Ganancia */}
      <div className={cn("card-apple p-6 text-center", ganancia >= 0 ? "bg-green-50/40" : "bg-red-50/40")}>
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ganancia</div>
        <div className={cn("text-3xl sm:text-4xl tabular-nums font-bold", ganancia >= 0 ? "text-green-600" : "text-red-600")}>
          {ganancia >= 0 ? "+" : ""}${fmt(Math.round(ganancia))} USD
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Físico + Zelle + A favor − Deudas − Wires − Ext
        </div>
      </div>

      {/* El Toque */}
      {tasas && <ElToqueSection tasas={tasas} />}
    </div>
  );
}
