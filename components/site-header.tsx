import Link from "next/link";

const NAV = [
  { href: "/", label: "Arena" },
  { href: "/history", label: "History" },
];

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-lg bg-foreground text-[11px] font-semibold text-background [corner-shape:squircle]">
            vs
          </span>
          <span className="text-sm font-medium tracking-tight">
            Battle Arena
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [corner-shape:squircle]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export { SiteHeader };
