import { buscarContribuyente } from "@/infrastructure/hacienda/hacienda-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim().replace(/\D/g, "") ?? "";

  if (id.length < 9) {
    return Response.json({ error: "Identificación muy corta" }, { status: 400 });
  }

  const result = await buscarContribuyente(id);
  if (!result) {
    return Response.json({ error: "No encontrado en Hacienda" }, { status: 404 });
  }

  return Response.json(result);
}
