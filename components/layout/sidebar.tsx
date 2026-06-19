"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, TrendingUp, Users, UserCheck, ArrowRightLeft, Receipt, Bell, Settings, PlusCircle, Wallet, Clock } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nuevo", label: "Nuevo", icon: PlusCircle },
  { href: "/remeseros", label: "Remeseros", icon: Users },
  { href: "/cuadres", label: "Cuadres", icon: ClipboardList },
  { href: "/wires", label: "Wires", icon: TrendingUp },
  { href: "/wire-buyers", label: "Wire Buyers", icon: UserCheck },
  { href: "/zelle", label: "Zelle", icon: Wallet },
  { href: "/deudas", label: "Deudas", icon: Receipt },
  { href: "/proyectos", label: "Proyectos", icon: TrendingUp },
  { href: "/historial", label: "Historial", icon: Clock },
  { href: "/tesoreria/movimiento", label: "Compra/Venta USD", icon: ArrowRightLeft },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/config", label: "Config", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-52 flex-col glass-sidebar p-5">
      <div className="mb-8 mt-2">
        <h1 className="text-xl font-bold tracking-tight text-primary">Killer</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Gestión de remesas</p>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
