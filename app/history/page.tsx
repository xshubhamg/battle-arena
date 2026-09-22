import type { Metadata } from "next";
import Link from "next/link";

import { Squircle } from "@/components/squircle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCharacterById } from "@/lib/characters";
import { listBattles } from "@/lib/db";

export const metadata: Metadata = {
  title: "History",
};

export const dynamic = "force-dynamic";

function formatEdge(edge: number | null): string {
  if (edge === null) return "—";
  return `${edge >= 0 ? "+" : ""}${edge.toFixed(2)}`;
}

export default async function HistoryPage() {
  const battles = await listBattles(30);

  const ids = Array.from(
    new Set(battles.flatMap((battle) => [battle.fighterAId, battle.fighterBId])),
  );
  const characters = await Promise.all(ids.map(getCharacterById));
  const nameById = new Map(
    ids.map((id, index) => [id, characters[index]?.name ?? id]),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Battle history
        </h1>
        <p className="text-sm text-muted-foreground">
          Every judged battle, newest first. Data lives locally in SQLite.
        </p>
      </div>

      {battles.length === 0 ? (
        <Squircle className="grid place-items-center border border-dashed border-border py-24">
          <p className="mb-4 text-sm text-muted-foreground">
            No battles judged yet.
          </p>
          <Link href="/#roster" className={buttonVariants({ size: "sm" })}>
            Pick two fighters
          </Link>
        </Squircle>
      ) : (
        <Squircle className="overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matchup</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Edge</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Judged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {battles.map((battle) => {
                const a = nameById.get(battle.fighterAId) ?? battle.fighterAId;
                const b = nameById.get(battle.fighterBId) ?? battle.fighterBId;
                const winner =
                  battle.winner === "draw"
                    ? "Draw"
                    : battle.winner === "a"
                      ? a
                      : battle.winner === "b"
                        ? b
                        : "—";
                const href = `/battle/${encodeURIComponent(
                  battle.fighterAId,
                )}/${encodeURIComponent(battle.fighterBId)}`;

                return (
                  <TableRow key={battle.id}>
                    <TableCell>
                      <Link
                        href={href}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {a} vs {b}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={battle.winner === "draw" ? "secondary" : "default"}
                      >
                        {winner}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {formatEdge(battle.edge)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {battle.model ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(battle.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Squircle>
      )}
    </main>
  );
}
