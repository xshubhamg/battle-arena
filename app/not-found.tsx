import Link from "next/link";

import { Squircle } from "@/components/squircle";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-24">
      <Squircle className="flex w-full max-w-md flex-col items-center gap-4 border border-border bg-card p-10 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          404
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          This fighter left the arena
        </h1>
        <p className="text-sm text-muted-foreground">
          The character or battle you asked for could not be found.
        </p>
        <Link href="/" className={buttonVariants({ size: "sm" })}>
          Back to the arena
        </Link>
      </Squircle>
    </main>
  );
}
