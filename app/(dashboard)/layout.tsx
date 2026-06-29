import { AppShell } from "@/components/layout/app-shell";
import { MobileControls } from "@/components/layout/mobile-controls";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <MobileControls />
    </>
  );
}
