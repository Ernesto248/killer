import { db } from "@/lib/db";
import { remesero } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { CuadreTab } from "./cuadre-tab";
import { UsdTab } from "./usd-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function NuevoPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; remesero?: string }>;
}) {
  const sp = await searchParams;
  const defaultTab = sp.tab === "usd" ? "usd" : "cuadre";
  const preselectedRemesero = sp.remesero ?? undefined;

  const remeseros = await db
    .select({ id: remesero.id, name: remesero.name })
    .from(remesero)
    .where(eq(remesero.isActive, true))
    .orderBy(asc(remesero.name));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Nuevo registro</h2>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full max-w-sm">
          <TabsTrigger value="cuadre" className="flex-1">Pegar cuadre</TabsTrigger>
          <TabsTrigger value="usd" className="flex-1">USD</TabsTrigger>
        </TabsList>
        <TabsContent value="cuadre" className="mt-4">
          <CuadreTab remeseros={remeseros} initialRemesero={preselectedRemesero} />
        </TabsContent>
        <TabsContent value="usd" className="mt-4">
          <UsdTab remeseros={remeseros} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
