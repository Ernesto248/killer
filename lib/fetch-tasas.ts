let cached: { data: { usd: number; eur: number; updatedAt: string; ts: string } | null; ts: number } | null = null;
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function fetchTasas(): Promise<{ usd: number; eur: number; updatedAt: string; ts: string } | null> {
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
    if (res.status === 429 && cached?.data) {
      console.warn("HTTP 429, using stale cache");
      return cached.data;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = {
      usd: json.tasas?.USD ?? null,
      eur: json.tasas?.ECU ?? null,
      updatedAt: `${json.date} ${String(json.hour).padStart(2, "0")}:${String(json.minutes).padStart(2, "0")}`,
      ts: new Date(`${json.date}T${String(json.hour).padStart(2, "0")}:${String(json.minutes).padStart(2, "0")}:00`).toISOString(),
    };
    if (data.usd == null && data.eur == null) return null;
    cached = { data, ts: Date.now() };
    return data;
  } catch (e) {
    const msg = (e as Error).message;
    if (msg !== "HTTP 429") console.error("fetchTasas failed:", msg);
    return null;
  }
}
