import { computeDailySnapshot } from "@/lib/domain/snapshot";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
  const result = await computeDailySnapshot(new Date());
  return Response.json(result);
}
