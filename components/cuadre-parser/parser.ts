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

const STRIP = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFE00-\uFE0F\uFEFF\u200D]/g;
const clean = (t: string) => t.replace(STRIP, "");

export function parseCuadre(text: string): ParsedCuadre {
  const t = clean(text);

  // Find sections using STABLE separators (single emojis, not letter sequences)
  const sepPagado = "\u{1FA8E}";  // 🪎
  const sepPendientes = "\u{1F4CC}"; // 📌
  const tiradoMarker = "\u{1F1FA}\u{1F1F2}"; // 🇺🇲 US flag starts tirado line
  const finalBook = "\u{1F4D5}"; // 📕  — appears in final section
  const remeseroAt = /@\s*([^\n`]+?)(?:\s*```|$)/;

  // Pagado: text between 🪎 and 📌
  const pagadoStart = t.indexOf(sepPagado);
  const pagadoEnd = t.indexOf(sepPendientes, pagadoStart >= 0 ? pagadoStart : 0);
  let pagadoSection = "";
  if (pagadoStart >= 0 && pagadoEnd > pagadoStart) {
    pagadoSection = t.slice(pagadoStart, pagadoEnd);
  }

  // Tirado: text between 🇺🇲 and 📕 (or @)
  const tiradoStart = t.indexOf(tiradoMarker);
  const tiradoEnd = t.indexOf(finalBook, tiradoStart >= 0 ? tiradoStart + 1 : 0);
  let tiradoSection = "";
  if (tiradoStart >= 0 && tiradoEnd > tiradoStart) {
    tiradoSection = t.slice(tiradoStart, tiradoEnd);
  }

  // Inicial: text after "📖" (book emoji, 1F4D6) until 🪎
  const inicialBook = "\u{1F4D6}";
  const inicialStart = t.indexOf(inicialBook);
  const inicialEnd = t.indexOf(sepPagado, inicialStart >= 0 ? inicialStart : 0);
  let inicialSection = "";
  if (inicialStart >= 0 && inicialEnd > inicialStart) {
    inicialSection = t.slice(inicialStart, inicialEnd);
  } else if (inicialStart >= 0) {
    inicialSection = t.slice(inicialStart, inicialStart + 60); // fallback
  }

  // Final: text around 📕 until @
  const finalStart = t.indexOf(finalBook);
  const remMatch = remeseroAt.exec(finalStart >= 0 ? t.slice(finalStart) : t);
  let finalSection = "";
  if (finalStart >= 0) {
    finalSection = t.slice(finalStart, finalStart + 80);
  }

  // Parse amounts
  const inicialNums = inicialSection.match(/[\d.,]+/g)?.map(parseAmount) ?? [];
  const finalNums = finalSection.match(/[\d.,]+/g)?.map(parseAmount) ?? [];
  const finalLabel = /deuda|fondo/i.exec(finalSection)?.[0]?.toLowerCase() as "deuda" | "fondo" | undefined;

  const pagadoAmounts = [...pagadoSection.matchAll(/\$\s*([\d.,]+)/g)].map((m) => parseAmount(m[1]));
  const pagadoCup = pagadoAmounts.reduce((a: number, b: number) => a + b, 0);

  const tiradoItems = [...tiradoSection.matchAll(/([\d.,]+)\s*×\s*(\d+)/g)].map((m) => ({
    usd: parseAmount(m[1]),
    tasa: parseAmount(m[2]),
  }));

  const remMatch2 = remeseroAt.exec(t);
  const remesero = remMatch2 ? remMatch2[1].trim() : null;

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
