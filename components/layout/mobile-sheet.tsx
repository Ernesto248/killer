"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { navItems } from "./nav-items";

const primaryMobileHrefs = new Set(["/", "/remeseros", "/nuevo", "/cuadres"]);

export function MobileSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const pathname = usePathname();
  const extraItems = navItems.filter((item) => !primaryMobileHrefs.has(item.href));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 glass border-r border-black/5 pt-12">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold tracking-tight text-primary">Killer</SheetTitle>
        </SheetHeader>
        <nav className="flex max-h-[calc(100vh-7rem)] flex-col gap-1 overflow-y-auto pr-1">
          {extraItems.map((it) => {
            const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
