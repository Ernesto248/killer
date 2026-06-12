let cached: { data: { usd: number; eur: number; updatedAt: string } | null; ts: number } | null = null;
const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function fetchTasas(): Promise<{ usd: number; eur: number; updatedAt: string } | null> {
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.data;
  }

  const key = process.env.ELTOQUE_API_KEY;
  if (!key) {
    console.warn("ELTOQUE_API_KEY not set");
    return null;
  }

  try {
    const res = await fetch("https://tasas.eltoque.com/v1/trmi", {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = {
      usd: json.tasas?.USD ?? null,
      eur: json.tasas?.ECU ?? null,
      updatedAt: `${json.date} ${String(json.hour).padStart(2, "0")}:${String(json.minutes).padStart(2, "0")}`,
    };
    if (data.usd == null && data.eur == null) return null;
    cached = { data, ts: Date.now() };
    return data;
  } catch (e) {
    console.error("fetchTasas failed:", (e as Error).message);
    return null;
  }
}
