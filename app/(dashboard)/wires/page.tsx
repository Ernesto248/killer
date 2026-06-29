import { db } from "@/lib/db";
import { wireItem } from "@/lib/db/schema";
import { WiresManager } from "./wires-manager";

export const dynamic = "force-dynamic";

export default async function WiresPage() {
  const wires = await db.select().from(wireItem);
  return (
    <WiresManager
      wires={wires.map((wire) => ({
        id: wire.id,
        name: wire.name,
        amount: wire.amount,
        currency: wire.currency,
        direction: wire.direction,
        notes: wire.notes,
        isActive: wire.isActive,
      }))}
    />
  );
}
