"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, X, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type CuadreRow = {
  id: number;
  date: Date | null;
  remeseroName: string | null;
  inicial: string | null;
  pagado: string | null;
  final: string | null;
  label: string | null;
};

export function CuadresTable({ rows }: { rows: CuadreRow[] }) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search && !r.remeseroName?.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && r.date && new Date(r.date) < dateFrom) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setDate(to.getDate() + 1);
        if (r.date && new Date(r.date) >= to) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo]);

  const hasFilters = search || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar remesero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" className={cn("gap-2 font-normal", dateFrom && "text-foreground")}>
              <CalendarIcon className="h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yy") : "Desde"}
            </Button>}
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" className={cn("gap-2 font-normal", dateTo && "text-foreground")}>
              <CalendarIcon className="h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yy") : "Hasta"}
            </Button>}
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setDateFrom(undefined); setDateTo(undefined); }}
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {hasFilters ? "No se encontraron cuadres con esos filtros" : "No hay cuadres registrados"}
        </div>
      ) : (
        <div className="card-apple overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Remesero</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Inicial</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Pagado</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Final</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isDeuda = r.label === "deuda";
                  const isFondo = r.label === "fondo";
                  return (
                    <tr key={r.id} className="border-b border-black/5 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 tabular-nums whitespace-nowrap">{r.date?.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" }) ?? "—"}</td>
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">{r.remeseroName ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(r.inicial ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(r.pagado ?? 0).toLocaleString()}</td>
                      <td className={cn("px-4 py-3 text-right tabular-nums font-semibold", isDeuda && "text-red-600", isFondo && "text-green-600")}>
                        {Number(r.final ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {isDeuda && <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Deuda</span>}
                        {isFondo && <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Fondo</span>}
                        {!isDeuda && !isFondo && "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} de {rows.length} cuadres
      </p>
    </div>
  );
}
