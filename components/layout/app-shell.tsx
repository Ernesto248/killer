import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { UndoButton } from "./undo-button";
import { getLastUndoAction } from "@/server/actions/undo";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const undo = await getLastUndoAction();

  return (
    <div className="flex min-h-0 flex-1 bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <UndoButton undo={undo ? { ...undo, createdAt: undo.createdAt.toISOString() } : null} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-full">{children}</main>
      </div>
    </div>
  );
}
