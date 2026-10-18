import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { ResultsBoard } from "@/components/results/results-board";
import { Button } from "@/components/ui/button";
import { decodeMoveSpec } from "@/lib/lead-codec";
import { leadRepository } from "@/lib/lead-store";
import { getCity } from "@/lib/geo";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { cityLabel, fill, formatVolume } from "@/i18n/format";
import { localePath } from "@/i18n/paths";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/results/[leadId]">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const query = await searchParams;

  const token = typeof query.d === "string" ? query.d : null;
  const spec = token ? decodeMoveSpec(token) : null;
  if (!spec) return { title: dict.meta.resultsTitle };

  const from = getCity(spec.origin.cityCode);
  const to = getCity(spec.destination.cityCode);

  return {
    title:
      from && to
        ? `${cityLabel(locale, from, from.country)} → ${cityLabel(locale, to, to.country)}`
        : dict.meta.resultsTitle,
    description: fill(dict.meta.resultsDescription, {
      volume: formatVolume(locale, dict, spec.volumeM3),
    }),
    // A results page is personal to one enquiry; it should never be indexed,
    // so it needs no `alternates` either.
    robots: { index: false, follow: false },
  };
}

export default async function ResultsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/results/[leadId]">) {
  const { locale: rawLocale, leadId } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);

  const query = await searchParams;
  const token = typeof query.d === "string" ? query.d : null;
  const channelParam = typeof query.c === "string" ? query.c : null;
  const channel =
    channelParam === "phone" || channelParam === "email" || channelParam === "whatsapp"
      ? channelParam
      : "whatsapp";

  // Stored lead wins; the URL token is the stateless fallback for shared links.
  const stored = await leadRepository.get(leadId);
  const spec = stored
    ? {
        moveType: stored.moveType,
        origin: stored.origin,
        destination: stored.destination,
        moveDate: stored.moveDate,
        flexibility: stored.flexibility,
        propertySize: stored.propertySize,
        volumeM3: stored.volumeM3,
        serviceLevel: stored.serviceLevel,
        specialItems: stored.specialItems,
        extras: stored.extras,
      }
    : token
      ? decodeMoveSpec(token)
      : null;

  if (!spec) {
    return (
      <>
        <SiteHeader variant="flush" />
        <main id="main" className="py-28">
          <Shell className="flex flex-col items-center gap-5 text-center">
            <h1 className="text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05]">
              {dict.results.expiredTitle}
            </h1>
            <p className="max-w-md text-[15.5px] text-muted-foreground">
              {dict.results.expiredBody}
            </p>
            <Button asChild size="lg" className="rounded-full">
              <Link href={localePath(locale, "/")}>{dict.common.newSearch}</Link>
            </Button>
          </Shell>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="pb-16">
        <ResultsBoard leadId={leadId} token={token} spec={spec} channel={channel} />
      </main>
      <SiteFooter />
    </>
  );
}
