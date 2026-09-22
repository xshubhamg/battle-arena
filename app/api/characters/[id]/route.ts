import { getCharacterById } from "@/lib/characters";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const character = await getCharacterById(decodeURIComponent(id));

  if (!character) {
    return Response.json({ error: "Character not found" }, { status: 404 });
  }

  return Response.json({ character });
}
