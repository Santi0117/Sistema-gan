import { buscarCABYS } from "@/infrastructure/hacienda/hacienda-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return Response.json({ cabys: [] });
  }

  const cabys = await buscarCABYS(q);
  return Response.json({ cabys });
}
