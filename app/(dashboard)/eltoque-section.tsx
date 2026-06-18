import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function ElToqueSection({ tasas }: { tasas: { usd: number; eur: number; updatedAt: string; ts: string } }) {
  return (
    <>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">El Toque</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Dólar (CUP)</div>
          <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{tasas.usd?.toLocaleString() ?? "—"} CUP</div>
          <div className="text-xs text-muted-foreground mt-1">{timeAgo(tasas.ts)}</div>
        </div>
        <div className="card-apple p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Euro (CUP)</div>
          <div className="text-lg sm:text-2xl tabular-nums font-semibold mt-1">{tasas.eur?.toLocaleString() ?? "—"} CUP</div>
          <div className="text-xs text-muted-foreground mt-1">{timeAgo(tasas.ts)}</div>
        </div>
      </div>
    </>
  );
}
