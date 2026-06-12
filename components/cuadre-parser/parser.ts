export type ParsedCuadre = {
  remesero: string | null;
  balanceInicialCup: number | null;
  pagadoCup: number;
  pendientes: { usd: number; tasa: number };
  tirado: Array<{ usd: number; tasa: number }>;
  balanceFinalCup: number | null;
  balanceFinalLabel: "deuda" | "fondo" | null;
};

function parseAmount(raw: string): number {
  return Number(raw.replace(/[$*.,\s`]/g, "")) || 0;
}

function sanitize(text: string): string {
  return text
    .replace(/\u2068/g, "")
    .replace(/\u2069/g, "")
    .replace(/\u200E/g, "")
    .replace(/\u200F/g, "")
    .replace(/\u202A/g, "")
    .replace(/\u202C/g, "")
    .replace(/\u202D/g, "")
    .replace(/\u202E/g, "");
}

function findSection(text: string, markers: string[], untilMarkers: string[]): string {
  for (const marker of markers) {
    const start = text.indexOf(marker);
    if (start < 0) continue;
    const after = text.slice(start + marker.length);
    for (const until of untilMarkers) {
      const end = after.indexOf(until);
      if (end >= 0) return after.slice(0, end);
    }
    return after;
  }
  return "";
}

export function parseCuadre(text: string): ParsedCuadre {
  const t = sanitize(text);

  const tiradoSection = findSection(t, ["🆃🅸🆁🅐🅳🅞"], ["🚩 🅵🅸🅽🅐", "🚩 🅵🅸🅽🅐🅛"]);
  const inicialSection = findSection(t, ["🅸🅽🅸🅲🅸🅞 📖", "🅸🅽🅸🅲🅸🅞"], ["🪎"]);
  const pagadoSection = findSection(t, ["🅟🅐🅖🅐🅳🅞"], ["📌", "🅟🅴🅽"]);

  const finalSection = findSection(t, ["🅵🅸🅽🅐🅛 📕", "🅵🅸🅽🅐🅛"], ["@"]);

  const inicialNums = [...inicialSection.matchAll(/[\d.,]+/g)].map((m) => parseAmount(m[0]));
  const finalNums = [...finalSection.matchAll(/[\d.,]+/g)].map((m) => parseAmount(m[0]));
  const finalLabel = (/deuda|fondo/i).exec(finalSection)?.[0]?.toLowerCase() as "deuda" | "fondo" | undefined;

  const pagadoAmounts = [...pagadoSection.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseAmount(m[1]));
  const pagadoCup = pagadoAmounts.reduce((a, b) => a + b, 0);

  const tiradoItems = [...tiradoSection.matchAll(/([\d.,]+)\s*×\s*(\d+)/g)].map((m) => ({
    usd: parseAmount(m[1]),
    tasa: parseAmount(m[2]),
  }));

  const remeseroMatch = t.match(/@\s*([^\n`]+?)(?:\s*```|$)/);
  const remesero = remeseroMatch ? remeseroMatch[1].trim() : null;

  return {
    remesero,
    balanceInicialCup: inicialNums.length > 0 ? inicialNums[0] : null,
    pagadoCup,
    pendientes: { usd: 0, tasa: 0 },
    tirado: tiradoItems,
    balanceFinalCup: finalNums.length > 0 ? finalNums[0] : null,
    balanceFinalLabel: finalLabel ?? null,
  };
}
