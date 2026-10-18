"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BadgeCheck, Check, Clock, Leaf, Mail, MessageCircle, Phone, Zap } from "lucide-react";
import { MoverLogo } from "@/components/common/mover-logo";
import { MODE_ICONS } from "@/components/common/route-line";
import { Stars } from "@/components/common/stars";
import { getCity } from "@/lib/geo";
import { useI18n } from "@/i18n/provider";
import type { ContactChannel, Mover, PublicQuote } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MoverTag = "best" | "fastest" | null;

/** Icon per channel; every word comes from `dict.moverCard.channels`. */
const CHANNEL_ICONS: Record<ContactChannel, typeof Phone> = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  // The card has room for one mark; WhatsApp is the channel a carrier reaches
  // for first when every option is open.
  all: MessageCircle,
};

/**
 * A carrier the enquiry was sent to.
 *
 * The card no longer asks the customer to pick a channel or press send. Both
 * decisions were already made in the wizard — the preferred channel, and how
 * many carriers to contact — so by the time this board renders the requests
 * are out. The card's job is to confirm that and say what happens next, which
 * is why the only status it carries is "Request sent".
 */
export function MoverCard({
  quote,
  mover,
  tag,
  index,
  channel,
  originCode,
  destCode,
}: {
  quote: PublicQuote;
  mover: Mover;
  tag: MoverTag;
  index: number;
  /** The channel the customer chose in the wizard. */
  channel: ContactChannel;
  originCode: string;
  destCode: string;
}) {
  const { dict, t, href } = useI18n();
  const instant = quote.kind === "instant";
  const ModeIcon = MODE_ICONS[quote.mode];
  const modeLabel = dict.enums.modes[quote.mode].label;
  const active = dict.moverCard.channels[channel];
  const ChannelIcon = CHANNEL_ICONS[channel];
  const hq = getCity(mover.hqCity);

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index * 0.035, 0.22),
      }}
      className="group overflow-hidden rounded-2xl border border-verify/35 bg-card transition-all duration-300 hover:shadow-float"
    >
      <div className="p-5 sm:p-6">
        {/* identity ------------------------------------------------ */}
        <div className="flex items-start gap-4">
          <MoverLogo mover={mover} size="lg" className="rounded-2xl" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-x-2.5 gap-y-1.5">
              <Link
                href={href(`/movers/${mover.slug}`)}
                className="text-[19px] font-semibold tracking-[-0.025em] underline-offset-4 hover:underline"
              >
                {mover.name}
              </Link>
              {tag === "best" && <Tag tone="brand">{dict.moverCard.bestMatch}</Tag>}
              {instant && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] text-muted-foreground">
                  <Zap className="size-3" strokeWidth={2.5} />
                  {dict.moverCard.instantMatch}
                </span>
              )}

              {/* The status the whole board exists to report. */}
              <span className="ms-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-verify/12 px-2.5 py-1 text-[11.5px] font-medium text-verify">
                <Check className="size-3" strokeWidth={3} />
                {dict.moverCard.requestSent}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars rating={mover.rating} count={mover.reviewCount} />
              <span className="text-[13.5px] text-muted-foreground">
                {hq?.name ?? mover.hqCity} ·{" "}
                {t.fill(dict.moverCard.since, { year: t.year(mover.since) })}
              </span>
            </div>
          </div>
        </div>

        {/* route ---------------------------------------------------- */}
        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl bg-surface px-5 py-4">
          <div className="flex w-[200px] max-w-full shrink-0 items-center gap-2.5">
            <span className="code text-[14px]">{originCode}</span>
            <span className="h-px flex-1 dotted-route" />
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full bg-card"
              title={modeLabel}
            >
              <ModeIcon className="size-3.5" strokeWidth={2} />
            </span>
            <span className="h-px flex-1 dotted-route" />
            <span className="code text-[14px]">{destCode}</span>
          </div>

          <dl className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px]">
            <div>
              <dt className="text-muted-foreground">{dict.moverCard.transit}</dt>
              <dd className="mt-0.5 font-medium tnum">{t.days(quote.transitDays)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{dict.moverCard.collection}</dt>
              <dd className="mt-0.5 font-medium tnum">{t.dateRange(quote.pickupWindow)}</dd>
            </div>
            <div className="hidden lg:block">
              <dt className="text-muted-foreground">{dict.moverCard.delivery}</dt>
              <dd className="mt-0.5 font-medium tnum">{t.dateRange(quote.deliveryWindow)}</dd>
            </div>
          </dl>
        </div>

        {/* proof ---------------------------------------------------- */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-verify" />
            {t.fill(dict.moverCard.onTime, { pct: t.percent(mover.onTimeRate) })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {t.fill(dict.moverCard.repliesIn, { time: t.responseTime(mover.responseMins) })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Leaf className="size-3.5" />
            {t.fill(dict.moverCard.co2, { amount: t.number(quote.co2Kg) })}
          </span>
          {mover.certifications.slice(0, 2).map((cert) => (
            <span key={cert} className="rounded-full bg-muted px-2 py-0.5 text-[12px]">
              {cert}
            </span>
          ))}
          {mover.badges
            .filter((b) => b !== "instant_quote" && b !== "best_value")
            .slice(0, 1)
            .map((badge) => (
              <span key={badge} className="rounded-full bg-muted px-2 py-0.5 text-[12px]">
                {dict.enums.badges[badge].label}
              </span>
            ))}
        </div>
      </div>

      {/* what happens next ---------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t bg-surface/60 px-5 py-3.5 sm:px-6">
        <p className="inline-flex min-w-0 items-center gap-2 text-[14px]">
          <ChannelIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          <span className="text-muted-foreground">
            {t.fill(dict.moverCard.willReply, {
              promise: active.done,
              time: t.responseTime(mover.responseMins),
            })}
          </span>
        </p>
        {!instant && (
          <p className="text-[12.5px] text-muted-foreground/80">{dict.moverCard.manualPickup}</p>
        )}
      </div>
    </motion.article>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "brand" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        tone === "brand" ? "bg-brand text-ink" : "bg-ink text-background",
      )}
    >
      {children}
    </span>
  );
}
