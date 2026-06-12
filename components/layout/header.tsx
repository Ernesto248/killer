import { Bell } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <h1 className="text-lg font-semibold">Killer — Cuadres</h1>
      <Link href="/alertas" className="relative">
        <Bell className="h-5 w-5" />
      </Link>
    </header>
  );
}
