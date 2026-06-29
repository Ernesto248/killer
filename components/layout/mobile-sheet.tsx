"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TrendingUp, ArrowRightLeft, Receipt, Bell, Settings } from "lucide-react";

const extraItems = [
  { href: "/wires", label: "Wires", icon: TrendingUp },
  { href: "/tesoreria/movimiento", label: "Compra/Venta USD", icon: ArrowRightLeft },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/config", label: "Configuración", icon: Settings },
];

export function MobileSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 glass border-r border-black/5 pt-12">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold tracking-tight text-primary">Killer</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => onOpenChange(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/nuevo"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            + Nuevo registro
          </Link>
          {extraItems.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
