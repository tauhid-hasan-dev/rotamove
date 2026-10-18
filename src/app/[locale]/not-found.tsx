import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/dictionaries";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { localePath } from "@/i18n/paths";

/**
 * A 404 inside a locale segment.
 *
 * `not-found.tsx` receives no params, so the locale cannot be read from the
 * route here. It falls back to English rather than going dynamic — the header
 * and footer are client components and still render through the provider in
 * the visitor's language, so only these three lines are affected.
 */
export default function NotFound() {
  const locale = DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="relative overflow-hidden py-28">
        <div
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[400px] opacity-40 glow-brand"
          aria-hidden
        />
        <Shell className="flex flex-col items-start gap-6">
          <p className="eyebrow">{dict.notFound.eyebrow}</p>
          <h1 className="max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.0] tracking-[-0.045em]">
            {dict.notFound.title}
          </h1>
          <p className="max-w-lg text-[16px] leading-relaxed text-muted-foreground">
            {dict.notFound.body}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href={localePath(locale, "/")}>{dict.common.startSearch}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href={localePath(locale, "/coverage")}>{dict.common.browseCorridors}</Link>
            </Button>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
