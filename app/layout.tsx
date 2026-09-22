import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Battle Arena",
    template: "%s — Battle Arena",
  },
  description:
    "Pit characters from anime, comics, and shows against each other. Jev, TypeSafe's System One model, decides the winner and the edge.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="border-t border-border/70">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Verdicts by Jev · TypeSafe AI System One. Character data from
                AniList, SuperHero API, TVMaze and Wikipedia.
              </p>
              <p className="font-mono">1v1 · typed decisions only</p>
            </div>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
