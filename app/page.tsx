import Link from "next/link";
import { ArrowRight, Cpu, Swords, Trophy } from "lucide-react";

import { Roster } from "@/components/arena/roster";
import { TextReveal } from "@/components/motion/text-reveal";
import { Squircle } from "@/components/squircle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  {
    icon: Swords,
    title: "Pick two fighters",
    body: "Choose from anime, comics, and shows. Every fighter carries the same normalized shape, so any two can be matched.",
  },
  {
    icon: Cpu,
    title: "Jev reads the state",
    body: "Both fighters are sent as one state with a bank of typed questions — a winner Choice, six comparative Scores, a coin-flip Noul.",
  },
  {
    icon: Trophy,
    title: "Winner and edge",
    body: "Jev returns calibrated probabilities. Your code weights the dimensions into a single signed edge you can rank and explain.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="outline" className="font-mono">
              Jev · System One · typed decisions only
            </Badge>

            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
              <TextReveal text="Who wins" as="span" />
              <span className="block text-muted-foreground">
                <TextReveal text="when the arena decides?" split="char" />
              </span>
            </h1>

            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
              Battle Arena pits characters from anime, comics, and shows in a
              monochrome 1v1 stage. Jev — TypeSafe&apos;s System One model —
              evaluates both fighters against a rubric and returns a winner, a
              probability spread, and the edge that separates them.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="#roster" className={buttonVariants({ size: "lg" })}>
                Choose fighters
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href="#how"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                How judging works
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex w-full max-w-md items-stretch gap-3">
              <Squircle className="relative flex flex-1 items-end justify-start overflow-hidden border border-border bg-muted/40 p-5">
                <span className="text-2xl font-semibold tracking-tight text-muted-foreground">
                  A
                </span>
              </Squircle>
              <div className="flex flex-col items-center justify-center gap-2">
                <Separator
                  orientation="vertical"
                  className="h-10 data-[orientation=vertical]:h-10"
                />
                <span className="text-sm font-semibold tracking-widest">
                  VS
                </span>
                <Separator
                  orientation="vertical"
                  className="h-10 data-[orientation=vertical]:h-10"
                />
              </div>
              <Squircle className="relative flex flex-1 items-end justify-end overflow-hidden border border-border bg-foreground/5 p-5">
                <span className="text-2xl font-semibold tracking-tight text-muted-foreground">
                  B
                </span>
              </Squircle>
            </div>
          </div>
        </div>
      </section>

      <Roster />

      <section id="how" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Three moves
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The judge does not write prose. It answers typed questions, and the
            code owns every weight and threshold — so a verdict is inspectable
            down to the dimension.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.title}>
              <CardHeader>
                <step.icon className="size-5 text-muted-foreground" />
                <CardTitle className="mt-2">{step.title}</CardTitle>
                <CardDescription>{step.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
