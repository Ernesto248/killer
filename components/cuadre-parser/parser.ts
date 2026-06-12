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
  return Number(raw.replace(/[$.*\s`]/g, "").replace(/,/g, "")) || 0;
}

function findSection(text: string, marker: string, untilMarker: string): string {
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const after = text.slice(start + marker.length);
  const end = after.indexOf(untilMarker);
  return end < 0 ? after : after.slice(0, end);
}

export function parseCuadre(text: string): ParsedCuadre {
  const tiradoSection = findSection(text, "🆃🅸🆁🅐🅳🅞", "🚩 🅵🅸🅽🅐");
  const inicialSection = findSection(text, "🅸🅽🅸🅲🅸🅞 📖", "🪎");
  const pagadoSection = findSection(text, "🅟🅐🅖🅐🅳🅞", "📌");
  const pendientesSection = findSection(text, "🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂", "🇺🇲");
  const finalSection = findSection(text, "🅵🅸🅽🅐🅛 📕", "@");

  const inicialMatch = inicialSection.match(/([\d.,]+)\s*`?(deuda|fondo)`?/i);
  const finalMatch = finalSection.match(/([\d.,]+)\s*`?(deuda|fondo)`?/i);

  const pagadoAmounts = [...pagadoSection.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseAmount(m[1]));
  const pagadoCup = pagadoAmounts.reduce((a, b) => a + b, 0);

  const pendientesMatch = pendientesSection.match(/([\d.,]+)\s*×\s*([\d.,]+)/);
  const pendientes = pendientesMatch
    ? { usd: parseAmount(pendientesMatch[1]), tasa: parseAmount(pendientesMatch[2]) }
    : { usd: 0, tasa: 0 };

  const tiradoItems = [...tiradoSection.matchAll(/([\d.,]+)\s*×\s*([\d.,]+)/g)].map((m) => ({
    usd: parseAmount(m[1]),
    tasa: parseAmount(m[2]),
  }));

  const remeseroMatch = text.match(/@([^\n`]+?)(\s*```|$)/);
  const remesero = remeseroMatch ? remeseroMatch[1].trim() : null;

  return {
    remesero,
    balanceInicialCup: inicialMatch ? parseAmount(inicialMatch[1]) : null,
    pagadoCup,
    pendientes,
    tirado: tiradoItems,
    balanceFinalCup: finalMatch ? parseAmount(finalMatch[1]) : null,
    balanceFinalLabel: finalMatch ? (finalMatch[2].toLowerCase() as "deuda" | "fondo") : null,
  };
}
