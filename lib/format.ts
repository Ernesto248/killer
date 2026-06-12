export function formatInputNumber(value: number): string {
  if (!value && value !== 0) return "";
  return value.toLocaleString("es-ES");
}

export function parseInputNumber(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    if (lastComma > lastDot) {
      return Number(cleaned.replace(/\./g, "").replace(",", "."));
    }
    return Number(cleaned.replace(/,/g, ""));
  }
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    if (cleaned.endsWith(",00") || cleaned.endsWith(",50")) {
      return Number(cleaned.replace(",", "."));
    }
    return Number(cleaned.replace(/,/g, ""));
  }
  return Number(cleaned) || 0;
}
