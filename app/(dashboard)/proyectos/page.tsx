import { db } from "@/lib/db";
import { project } from "@/lib/db/schema";
import { ProyectosManager } from "./proyectos-manager";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const projects = await db.select().from(project);
  return <ProyectosManager projects={projects} />;
}
