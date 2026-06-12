"use client";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/cuadres": "Cuadres",
  "/cuadres/nuevo": "Nuevo cuadre",
  "/wires": "Wires",
  "/wires/nuevo": "Nuevo wire",
  "/remeseros": "Remeseros",
  "/wire-buyers": "Wire Buyers",
  "/tesoreria/movimiento": "Tesorería",
  "/gastos": "Gastos",
  "/gastos/nuevo": "Nuevo gasto",
  "/alertas": "Alertas",
  "/config": "Configuración",
  "/config/cuentas": "Cuentas",
  "/config/categorias": "Categorías",
};

export function Header() {
  const pathname = usePathname();
  const title = titles[pathname] || "Killer";

  return (
    <header className="flex h-14 items-center justify-between glass-header px-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <Link href="/alertas" className="relative p-1.5 rounded-full hover:bg-accent transition-colors">
        <Bell className="h-4 w-4" />
      </Link>
    </header>
  );
}
