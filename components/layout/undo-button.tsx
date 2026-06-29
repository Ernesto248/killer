"use client";
import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { undoLastAction } from "@/server/actions/undo";

type UndoInfo = {
  id: number;
  description: string;
  createdAt: string;
};

export function UndoButton({ undo }: { undo: UndoInfo | null }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  if (!undo) return null;

  return (
    <div className="border-b border-black/5 bg-muted/35 px-3 py-2 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="min-w-0">
          <span className="font-medium">Ultimo cambio:</span>{" "}
          <span className="text-muted-foreground">{undo.description}</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Deshacer
          </Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Deshacer ultimo cambio</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Se va a revertir:</p>
              <p className="font-medium text-foreground">{undo.description}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" disabled={pending} onClick={() => start(async () => {
                await undoLastAction(undo.id);
                setOpen(false);
              })}>{pending ? "..." : "Deshacer"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
