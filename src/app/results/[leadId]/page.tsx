import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { ResultsBoard } from "@/components/results/results-board";
import { Button } from "@/components/ui/button";
import { decodeMoveSpec } from "@/lib/lead-codec";
import { leadRepository } from "@/lib/lead-store";
import { cityLabel } from "@/lib/geo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: PageProps<"/results/[leadId]">): Promise<Metadata> {
  const params = await searchParams;
  const token = typeof params.d === "string" ? params.d : null;
  const spec = token ? decodeMoveSpec(token) : null;
  if (!spec) return { title: "Your moving quotes" };
  return {
    title: `${cityLabel(spec.origin.cityCode)} → ${cityLabel(spec.destination.cityCode)}`,
    description: `Verified movers for a ${spec.volumeM3} m³ move.`,
    robots: { index: false, follow: false },
  };
}

export default async function ResultsPage({
  params,
  searchParams,
}: PageProps<"/results/[leadId]">) {
  const { leadId } = await params;
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
              That search has expired
            </h1>
            <p className="max-w-md text-[15.5px] text-muted-foreground">
              Links stay live for 30 days. Start again and we&apos;ll rematch in seconds.
            </p>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/">New search</Link>
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
