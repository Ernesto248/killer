"use client";
import { dismissAlert } from "@/server/actions/alert";
import { Button } from "@/components/ui/button";

export function DismissButton({ id }: { id: number }) {
  return <Button variant="ghost" size="sm" onClick={() => dismissAlert(id)}>Descartar</Button>;
}
