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
  return Number(raw.replace(/[$.*\s`]/g, "").replace(/,/g, "").replace(".", "").replace(/(\d)\.(\d{3})/g, "$1$2")) || 0;
}

function parseAmountFlex(raw: string): number {
  const cleaned = raw.replace(/[$*\s`]/g, "").replace(/,/g, "");
  return Number(cleaned) || 0;
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

  // Tirado: between 🆃🅸🆁🅰🅳🅞 and 🅵🅸🅽🅰
  const tiradoSection = findSection(t, ["🆃🅸🆁🅰🅳🅞"], ["🚩 🅵🅸🅽🅐", "🚩 🅵🅸🅽🅐"]);

  // Inicial: between 🅸🅽🅸🅲🅸🅞 and 🪎
  const inicialSection = findSection(t, ["🅸🅽🅸🅲🅸🅞 📖", "🅸🅽🅸🅲🅸🅞"], ["🪎", "📖"]);

  // Pagado: between 🅟🅐🅖🅐🅳🅞 and 📌
  const pagadoSection = findSection(t, ["🅟🅐🅖🅐🅳🅞"], ["📌", "🅟🅴🅽"]);

  // Pendientes: between 🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂 and 🇺🇲
  const pendientesSection = findSection(t, ["🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂"], ["🇺🇲"]);

  // Final: between 🅵🅸🅽🅐🅛 and @
  const finalSection = findSection(t, ["🅵🅸🅽🅐🅛 📕", "🅵🅸🅽🅐🅛"], ["@"]);

  // Parse amounts
  const inicialMatch = inicialSection.match(/([\d.,]+)\s*`?(deuda|fondo)`?/i);
  const finalMatch = finalSection.match(/([\d.,]+)\s*`?(deuda|fondo)`?/i);

  const pagadoAmounts = [...pagadoSection.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseAmountFlex(m[1]));
  const pagadoCup = pagadoAmounts.reduce((a, b) => a + b, 0);

  const pendientesMatch = pendientesSection.match(/([\d.,]+)\s*×\s*([\d.,]+)/);
  const pendientes = pendientesMatch
    ? { usd: parseAmountFlex(pendientesMatch[1]), tasa: parseAmountFlex(pendientesMatch[2]) }
    : { usd: 0, tasa: 0 };

  const tiradoItems = [...tiradoSection.matchAll(/([\d.,]+)\s*×\s*(\d+)/g)].map((m) => ({
    usd: parseAmountFlex(m[1]),
    tasa: parseAmountFlex(m[2]),
  }));

  // Remesero: everything after @ until end or ```
  const remeseroMatch = t.match(/@\s*([^\n`]+?)(?:\s*```|$)/);
  const remesero = remeseroMatch ? remeseroMatch[1].trim() : null;

  return {
    remesero,
    balanceInicialCup: inicialMatch ? parseAmountFlex(inicialMatch[1]) : null,
    pagadoCup,
    pendientes,
    tirado: tiradoItems,
    balanceFinalCup: finalMatch ? parseAmountFlex(finalMatch[1]) : null,
    balanceFinalLabel: finalMatch ? (finalMatch[2].toLowerCase() as "deuda" | "fondo") : null,
  };
}
