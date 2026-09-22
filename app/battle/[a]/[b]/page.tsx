import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BattleView } from "@/components/arena/battle-view";
import { VsStage } from "@/components/arena/vs-stage";
import { getCharacterById } from "@/lib/characters";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/battle/[a]/[b]">): Promise<Metadata> {
  const { a, b } = await params;
  const [fighterA, fighterB] = await Promise.all([
    getCharacterById(decodeURIComponent(a)),
    getCharacterById(decodeURIComponent(b)),
  ]);
  if (!fighterA || !fighterB) return { title: "Battle" };
  return { title: `${fighterA.name} vs ${fighterB.name}` };
}

export default async function BattlePage({
  params,
}: PageProps<"/battle/[a]/[b]">) {
  const { a, b } = await params;
  const [fighterA, fighterB] = await Promise.all([
    getCharacterById(decodeURIComponent(a)),
    getCharacterById(decodeURIComponent(b)),
  ]);

  if (!fighterA || !fighterB) notFound();

  return (
    <main className="flex-1">
      <VsStage a={fighterA} b={fighterB}>
        <BattleView fighterA={fighterA} fighterB={fighterB} />
      </VsStage>
    </main>
  );
}
