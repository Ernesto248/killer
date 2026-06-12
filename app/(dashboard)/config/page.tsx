import { db } from "@/lib/db";
import { config } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";
import { TasaGlobalForm } from "./tasa-form";
import Link from "next/link";

export default async function ConfigPage() {
  const [tasa] = await db.select().from(config).where(eq(config.key, "tasa_global"));
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Configuración</h2>
      <TasaGlobalForm initialRate={(tasa?.value as { rate: number })?.rate ?? 0} />
      <ul className="space-y-2">
        <li><Link href="/config/cuentas" className="underline">Cuentas</Link></li>
        <li><Link href="/config/categorias" className="underline">Categorías</Link></li>
      </ul>
    </div>
  );
}
