import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, Minus, Quote as QuoteIcon, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { MoverLogo } from "@/components/common/mover-logo";
import { MODE_META } from "@/components/common/route-line";
import { Stars } from "@/components/common/stars";
import { Button } from "@/components/ui/button";
import { CORRIDORS, REGIONS, cityLabel, getCity } from "@/lib/geo";
import { BADGE_LABELS, MOVERS, getMoverBySlug } from "@/lib/movers";
import { createRng } from "@/lib/rand";
import { formatNumber, formatResponseTime, pct } from "@/lib/format";
import type { Mover } from "@/lib/types";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return MOVERS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/movers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const mover = getMoverBySlug(slug);
  if (!mover) return { title: "Mover not found" };
  return {
    title: `${mover.name} — reviews and corridors`,
    description: mover.blurb,
  };
}

const SERVICE_LABELS: Record<keyof Mover["services"], string> = {
  packing: "Professional packing",
  storage: "Bonded storage",
  customs: "In-house customs brokerage",
  vehicle: "Car & motorbike shipping",
  piano: "Piano and fine-art handling",
  cleaning: "End-of-tenancy cleaning",
};

const REVIEW_BODIES = [
  "Crew arrived fifteen minutes early, wrapped everything properly and the delivery landed on the first day of the window. The final invoice matched the quote exactly.",
  "Good communication throughout — I had a named contact who answered on WhatsApp within minutes. One small scuff on a wardrobe door, sorted without argument.",
  "Customs paperwork was handled entirely by them, which was the whole reason I picked them. Nothing for me to sign at the border.",
  "Not the cheapest quote on the board but the delivery estimate was honest, which the cheaper one was not when I checked afterwards.",
  "Packed a full three-bedroom house in a day. They brought more materials than they needed, which I would rather have than the opposite.",
  "Second move with this company. Same standard, same crew lead. That consistency is worth paying for on a long corridor.",
];

const REVIEW_NAMES = [
  "Elif Y.", "Jonas R.", "Marta K.", "Deniz A.", "Sofia L.", "Rustam N.",
  "Hanna B.", "Kerem Ö.", "Ingrid S.", "Omar H.",
];

function buildReviews(mover: Mover, count = 5) {
  const rng = createRng("reviews", mover.id);
  const lanes = CORRIDORS.filter(
    (c) => mover.regions.includes(c.from) && mover.regions.includes(c.to),
  );
  return Array.from({ length: count }, (_, i) => {
    const lane = lanes.length ? lanes[i % lanes.length] : CORRIDORS[0];
    const rating = Math.min(5, Math.max(3, Math.round((mover.rating + rng.range(-0.6, 0.4)) * 2) / 2));
    return {
      id: `${mover.id}-r${i}`,
      name: rng.pick(REVIEW_NAMES),
      body: rng.pick(REVIEW_BODIES),
      rating,
      lane: lane.label,
      volume: rng.int(14, 82),
      monthsAgo: rng.int(1, 16),
    };
  });
}

export default async function MoverPage({ params }: PageProps<"/movers/[slug]">) {
  const { slug } = await params;
  const mover = getMoverBySlug(slug);
  if (!mover) notFound();

  const hq = getCity(mover.hqCity);
  const reviews = buildReviews(mover);
  const lanes = CORRIDORS.filter(
    (c) => mover.regions.includes(c.from) && mover.regions.includes(c.to),
  );
  const isPro = mover.plan === "pro_unlimited";

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="pb-20">
        {/* header ----------------------------------------------- */}
        <section className="relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[520px] opacity-75 glow-brand" aria-hidden />
          <Shell className="py-10 sm:py-14">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-start">
              <MoverLogo mover={mover} size="xl" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.05] tracking-[-0.04em]">
                    {mover.name}
                  </h1>
                  {isPro && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-[11.5px] font-medium text-ink">
                      <Zap className="size-3" />
                      Instant match
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  {mover.legalName} · {hq ? cityLabel(hq.code) : mover.hqCity} · Established{" "}
                  {mover.since}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Stars rating={mover.rating} count={mover.reviewCount} />
                  <span className="text-[13.5px] text-muted-foreground">
                    {formatNumber(mover.completedMoves)} completed moves
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {mover.badges.map((badge) => (
                    <span
                      key={badge}
                      title={BADGE_LABELS[badge].hint}
                      className="rounded-md border bg-background px-2 py-1 text-[11.5px] font-medium text-muted-foreground"
                    >
                      {BADGE_LABELS[badge].label}
                    </span>
                  ))}
                  {mover.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11.5px] font-medium"
                    >
                      <BadgeCheck className="size-3 text-verify" />
                      {cert}
                    </span>
                  ))}
                </div>

                <p className="mt-6 max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">
                  {mover.blurb}
                </p>
              </div>

              <div className="shrink-0 lg:w-[250px]">
                <div className="rounded-2xl border bg-card p-5">
                  <p className="eyebrow">
                    {isPro ? "Instant match" : "Replies the same day"}
                  </p>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {isPro
                      ? "Confirms availability as soon as your search runs."
                      : "Picks up enquiries by hand, then gets in touch."}
                  </p>
                  <Button asChild className="mt-4 w-full rounded-full">
                    <Link href="/">
                      Start a search
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <p className="mt-3 text-center text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                    replies in {formatResponseTime(mover.responseMins)}
                  </p>
                </div>
              </div>
            </div>
          </Shell>
        </section>

        {/* stats ------------------------------------------------ */}
        <Shell className="py-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["On-time delivery", pct(mover.onTimeRate)],
              ["Claim rate", `${(mover.claimRate * 100).toFixed(1)}%`],
              ["Own trucks", String(mover.fleetTrucks)],
              ["Crew", String(mover.crewSize)],
              ["Cover", "Full replacement value"],
              ["Free cancellation", `${mover.freeCancellationDays} days`],
            ].map(([label, value]) => (
              <div key={label} className="border-t pt-4">
                <dd className="text-[clamp(1.2rem,2.2vw,1.6rem)] font-medium leading-none tnum">
                  {value}
                </dd>
                <dt className="mt-2 text-[12.5px] text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
        </Shell>

        {/* detail ----------------------------------------------- */}
        <Shell className="grid gap-10 py-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="space-y-10">
            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">
                Corridors they run
              </h2>
              <ul className="mt-5 space-y-2.5">
                {lanes.map((lane) => (
                  <li
                    key={lane.id}
                    className="flex items-center gap-4 rounded-xl border bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{lane.label}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground tnum">
                        {lane.transitDays[0]}–{lane.transitDays[1]} days typical
                      </p>
                    </div>
                    <span className="flex shrink-0 gap-1">
                      {lane.modes
                        .filter((m) => mover.modes.includes(m))
                        .map((mode) => {
                          const { Icon, label } = MODE_META[mode];
                          return (
                            <span
                              key={mode}
                              title={label}
                              className="grid size-7 place-items-center rounded-md border bg-background"
                            >
                              <Icon className="size-3.5 text-muted-foreground" />
                            </span>
                          );
                        })}
                    </span>
                  </li>
                ))}
                {lanes.length === 0 && (
                  <li className="rounded-xl border border-dashed p-5 text-[13.5px] text-muted-foreground">
                    Covers {mover.regions.map((r) => REGIONS[r].name).join(", ")} through the
                    extended network.
                  </li>
                )}
              </ul>
            </section>

            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">
                Reviews
              </h2>
              <ul className="mt-5 space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-xl border bg-card p-5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <QuoteIcon className="size-4 shrink-0 text-brand" />
                      <Stars rating={review.rating} compact />
                      <span className="text-[11.5px] text-muted-foreground tnum">
                        {review.lane} · {review.volume} m³ · {review.monthsAgo} months ago
                      </span>
                    </div>
                    <p className="mt-3 text-[14.5px] leading-relaxed">{review.body}</p>
                    <p className="mt-3 text-[12.5px] font-medium text-muted-foreground">
                      {review.name} · verified booking
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">
                Services
              </h2>
              <ul className="mt-5 space-y-2">
                {(Object.keys(SERVICE_LABELS) as Array<keyof Mover["services"]>).map((key) => {
                  const on = mover.services[key];
                  return (
                    <li
                      key={key}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-[14px]",
                        !on && "opacity-55",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded-full",
                          on ? "bg-verify/15 text-verify" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {on ? (
                          <Check className="size-2.5" strokeWidth={3.5} />
                        ) : (
                          <Minus className="size-2.5" strokeWidth={3} />
                        )}
                      </span>
                      {SERVICE_LABELS[key]}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2 className="text-[21px] tracking-[-0.03em]">
                Languages & regions
              </h2>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {mover.languages.map((lang) => (
                  <span key={lang} className="rounded-full border bg-card px-3 py-1.5 text-[13px]">
                    {lang}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {mover.regions.map((region) => (
                  <span
                    key={region}
                    className="rounded-full border border-brand bg-brand-soft px-3 py-1.5 text-[13px] text-foreground dark:bg-accent dark:text-foreground"
                  >
                    {REGIONS[region].name}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-dashed bg-surface/60 p-5">
              <h3 className="eyebrow">How this partner is billed</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                {isPro ? (
                  <>
                    {mover.name} is on <span className="font-medium text-foreground">Pro Unlimited</span>{" "}
                    — a flat $100 a month for every lead on the network. They pay the same whether
                    you choose them or not.
                  </>
                ) : (
                  <>
                    {mover.name} is on <span className="font-medium text-foreground">Pay Per Lead</span>{" "}
                    — they pay up to $7 to unlock an enquiry they want. No commission either way.
                  </>
                )}
              </p>
            </section>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
