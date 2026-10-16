import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[400px] opacity-40 glow-brand" aria-hidden />
        <Shell className="flex flex-col items-start gap-6">
          <p className="eyebrow">404 · no such route</p>
          <h1 className="max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.0] tracking-[-0.045em]">
            This corridor isn&apos;t on the board.
          </h1>
          <p className="max-w-lg text-[16px] leading-relaxed text-muted-foreground">
            The page has moved, or never existed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/">Start a search</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/coverage">Browse corridors</Link>
            </Button>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
