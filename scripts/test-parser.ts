import { parseCuadre } from "../components/cuadre-parser/parser";

// Minimal test isolated
import * as fs from "node:fs";

// Read the parser source and inject debug
const src = fs.readFileSync("components/cuadre-parser/parser.ts", "utf-8");
const testText = `🚩 🅸🅽🅸🅲🅸🅞 📖
       *$* *2.827.560* \`deuda\`

🪎 🅟🅐🅖🅐🅳🅞
       \`$ 5,000,000\`

📌 🅟🅴🅽🅳🅸🅴🅽🆃🅴🆂
       0 × 0

🇺🇲 🆃🅸🆁🅐🅳🅞 🇲🇽
      3756 × 573
         223 × 585
       2970 × 587
         330 × 595

🚩 🅵🅸🅽🅐🅛 📕
       *$* *2.049.943* \`deuda\`

@Naidiel Zll \`\`\`RECTIFICAR\`\`\``;

// Step by step manual check
function sanitize(text: string): string {
  return text.replace(/\u2068/g, "").replace(/\u2069/g, "").replace(/\u200E/g, "").replace(/\u200F/g, "").replace(/\u202A/g, "").replace(/\u202C/g, "").replace(/\u202D/g, "").replace(/\u202E/g, "");
}

if (testText.includes("\u2068") || testText.includes("\u2069")) {
  console.log("HAS invisible chars");
} else {
  console.log("NO invisible chars");
}

const st = sanitize(testText);

// Find tirado
const tiradoMarker = "🆃🅸🆁🅐🅳🅞";
const tiradoIdx = st.indexOf(tiradoMarker);
console.log("tiradoIdx:", tiradoIdx);

const finalMarker = "🚩 🅵🅸🅽🅐";  // Note: no 🅛
const finalMarkerFull = "🚩 🅵🅸🅽🅐🅛";

const afterTirado = st.slice(tiradoIdx + tiradoMarker.length);
console.log("afterTirado first 80 chars:", JSON.stringify(afterTirado.slice(0, 80)));

const finalPos = afterTirado.indexOf(finalMarker);
const finalPosFull = afterTirado.indexOf(finalMarkerFull);
console.log("finalPos (short):", finalPos, "finalPos (full):", finalPosFull);

if (finalPos >= 0) {
  const section = afterTirado.slice(0, finalPos);
  console.log("tirado section:", JSON.stringify(section));
  const matches = [...section.matchAll(/([\d.,]+)\s*×\s*(\d+)/g)];
  console.log("regex matches:", matches.length);
}

// Now call the actual parser
console.log("\n--- Actual parseCuadre ---");
const r = parseCuadre(testText);
console.log("remesero:", r.remesero, "inicial:", r.balanceInicialCup, "pagado:", r.pagadoCup, "tirado:", r.tirado.length, "final:", r.balanceFinalCup, "label:", r.balanceFinalLabel);
