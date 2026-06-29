"use client";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";
import { MobileSheet } from "./mobile-sheet";

export function MobileControls() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <MobileNav onMenuOpen={() => setMenuOpen(true)} />
      <MobileSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
