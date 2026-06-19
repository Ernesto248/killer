"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { saveSnapshotAction } from "@/server/actions/snapshot";

export function SaveSnapshotButton({ data }: { data: Parameters<typeof saveSnapshotAction>[0] }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={pending || done}
      onClick={async () => {
        setPending(true);
        await saveSnapshotAction(data);
        setPending(false);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      <Save className="h-3.5 w-3.5" />
      {done ? "¡Guardado!" : "Guardar snapshot"}
    </Button>
  );
}
