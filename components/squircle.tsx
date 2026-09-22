import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Squircle surface — the project's signature rounding.
 *
 * `corner-shape: squircle` gives true superellipse corners in Chromium 139+.
 * Every other browser falls back to the normal `border-radius`, so this is a
 * progressive enhancement, never a hard dependency. The base radius still comes
 * from the caller's `rounded-*` utility so the shape stays on the shadcn
 * `--radius` scale. See docs/adr/0004-squircle-rounding.md.
 */
function Squircle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="squircle"
      className={cn("rounded-3xl [corner-shape:squircle]", className)}
      {...props}
    />
  );
}

export { Squircle };
