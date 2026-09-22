import {
  DEFAULT_LIMIT,
  listCharacters,
  searchCharacters,
} from "@/lib/characters";
import { isSource } from "@/lib/sources";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceParam = searchParams.get("source") ?? "anime";

  if (!isSource(sourceParam)) {
    return Response.json(
      { error: `Unknown source: ${sourceParam}` },
      { status: 400 },
    );
  }

  const query = searchParams.get("q")?.trim() ?? "";
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(requestedLimit)
    ? requestedLimit
    : DEFAULT_LIMIT;

  try {
    const characters = query
      ? await searchCharacters(sourceParam, query, limit)
      : await listCharacters(sourceParam, limit);
    return Response.json({ characters });
  } catch (error) {
    console.error("characters route failed", error);
    return Response.json(
      { error: "Could not load characters" },
      { status: 502 },
    );
  }
}
