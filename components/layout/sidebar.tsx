"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/cuadres", label: "Cuadres" },
  { href: "/wires", label: "Wires" },
  { href: "/remeseros", label: "Remeseros" },
  { href: "/wire-buyers", label: "Wire Buyers" },
  { href: "/tesoreria/movimiento", label: "Tesorería" },
  { href: "/gastos", label: "Gastos" },
  { href: "/alertas", label: "Alertas" },
  { href: "/config", label: "Config" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-card p-4">
      <nav className="space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "block rounded px-3 py-2 text-sm hover:bg-accent",
              pathname === it.href && "bg-accent font-medium"
            )}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
