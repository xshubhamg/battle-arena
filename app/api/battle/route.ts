import { getCharacterById } from "@/lib/characters";
import {
  findBattleByPairing,
  saveBattle,
  type PersistedBattle,
} from "@/lib/db";
import { judgeBattle } from "@/lib/judge";

export const dynamic = "force-dynamic";

type BattleBody = {
  a?: unknown;
  b?: unknown;
  force?: unknown;
};

export async function POST(request: Request) {
  let body: BattleBody;
  try {
    body = (await request.json()) as BattleBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const a = typeof body.a === "string" ? body.a : null;
  const b = typeof body.b === "string" ? body.b : null;
  const force = body.force === true;

  if (!a || !b) {
    return Response.json(
      { error: "Body must include string ids `a` and `b`" },
      { status: 400 },
    );
  }
  if (a === b) {
    return Response.json(
      { error: "A fighter cannot battle itself" },
      { status: 400 },
    );
  }

  try {
    if (!force) {
      const existing = await findBattleByPairing(a, b);
      if (existing) {
        return Response.json({ battle: existing, cached: true });
      }
    }

    const [fighterA, fighterB] = await Promise.all([
      getCharacterById(a),
      getCharacterById(b),
    ]);
    if (!fighterA || !fighterB) {
      return Response.json(
        { error: "One or both fighters were not found" },
        { status: 404 },
      );
    }

    const verdict = await judgeBattle(fighterA, fighterB);
    const battle: PersistedBattle = {
      id: crypto.randomUUID(),
      fighterAId: a,
      fighterBId: b,
      winner: verdict.winner.side,
      edge: verdict.edge.value,
      model: verdict.model,
      verdict,
      createdAt: Date.now(),
    };
    await saveBattle(battle);

    return Response.json({ battle, cached: false });
  } catch (error) {
    console.error("battle route failed", error);
    return Response.json(
      { error: "Jev could not judge this battle" },
      { status: 502 },
    );
  }
}
