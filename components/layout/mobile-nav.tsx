"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Users, PlusCircle, Menu } from "lucide-react";

export function MobileNav({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/remeseros", label: "Remeseros", icon: Users },
    { href: "/nuevo", label: "Nuevo", icon: PlusCircle, primary: true },
    { href: "/cuadres", label: "Cuadres", icon: ClipboardList },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-2xl border-t border-black/5 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          if (it.primary) {
            return (
              <Link
                key={it.href}
                href={it.href}
                className="flex flex-col items-center justify-center gap-0.5 -mt-5"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <PlusCircle className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-medium text-primary">Nuevo</span>
              </Link>
            );
          }
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <it.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{it.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-muted-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </div>
    </nav>
  );
}
