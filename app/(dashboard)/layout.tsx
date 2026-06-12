"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileSheet } from "@/components/layout/mobile-sheet";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <AppShell>{children}</AppShell>
      <MobileNav onMenuOpen={() => setMenuOpen(true)} />
      <MobileSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
