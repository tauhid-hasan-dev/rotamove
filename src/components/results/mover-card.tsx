"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  Leaf,
  Mail,
  MessageCircle,
  Phone,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
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
};

const CHANNEL_ORDER: ContactChannel[] = ["whatsapp", "phone", "email"];


export function MoverCard({
  quote,
  mover,
  tag,
  index,
  defaultChannel,
  originCode,
  destCode,
}: {
  quote: PublicQuote;
  mover: Mover;
  tag: MoverTag;
  index: number;
  defaultChannel: ContactChannel;
  originCode: string;
  destCode: string;
}) {
  const { dict, t } = useI18n();
  const [channel, setChannel] = useState<ContactChannel>(defaultChannel);
  const [sent, setSent] = useState(false);
  const instant = quote.kind === "instant";
  const ModeIcon = MODE_ICONS[quote.mode];
  const modeLabel = dict.enums.modes[quote.mode].label;
  const active = dict.moverCard.channels[channel];

  const hq = getCity(mover.hqCity);

  const connect = () => {
    setSent(true);
    toast.success(t.fill(dict.moverCard.sentToast, { name: mover.name }), {
      description: active.done,
    });
  };

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
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        sent ? "border-verify/40" : "hover:shadow-float",
      )}
    >
      <div className="p-5 sm:p-6">
        {/* identity ------------------------------------------------ */}
        <div className="flex items-start gap-4">
          <MoverLogo mover={mover} size="lg" className="rounded-2xl" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <Link
                href={`/movers/${mover.slug}`}
                className="text-[19px] font-semibold tracking-[-0.025em] underline-offset-4 hover:underline"
              >
                {mover.name}
              </Link>
              {tag === "best" && <Tag tone="brand">{dict.moverCard.bestMatch}</Tag>}
              {tag === "fastest" && <Tag>{dict.moverCard.fastest}</Tag>}
              {instant && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] text-muted-foreground">
                  <Zap className="size-3" strokeWidth={2.5} />
                  {dict.moverCard.instantMatch}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars rating={mover.rating} count={mover.reviewCount} />
              <span className="text-[13.5px] text-muted-foreground">
                {hq?.name ?? mover.hqCity} ·{" "}
                {t.fill(dict.moverCard.since, { year: t.number(mover.since) })}
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

      {/* contact -------------------------------------------------- */}
      <div className="border-t bg-surface/60 px-5 py-4 sm:px-6">
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="grid size-7 place-items-center rounded-full bg-verify text-white">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <p className="min-w-0 flex-1 text-[14.5px]">
                <span className="font-medium">{dict.moverCard.requestSent}</span>{" "}
                <span className="text-muted-foreground">
                  {t.fill(dict.moverCard.willReply, {
                    promise: active.done,
                    time: t.responseTime(mover.responseMins),
                  })}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {dict.common.undo}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-3"
            >
              <div
                role="radiogroup"
                aria-label={dict.moverCard.channelAria}
                className="flex rounded-full border bg-card p-1"
              >
                {CHANNEL_ORDER.map((id) => {
                  const on = id === channel;
                  const Icon = CHANNEL_ICONS[id];
                  return (
                    <button
                      key={id}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setChannel(id)}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
                        on ? "text-ink" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {on && (
                        <motion.span
                          layoutId={`channel-${quote.id}`}
                          className="absolute inset-0 rounded-full bg-brand"
                          transition={{ type: "spring", stiffness: 480, damping: 36 }}
                        />
                      )}
                      <Icon className="relative size-3.5" strokeWidth={2} />
                      <span className="relative">{dict.moverCard.channels[id].label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={connect}
                className={cn(
                  "group/cta ms-auto inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-medium transition-all duration-200 active:scale-[0.985]",
                  instant
                    ? "bg-ink text-background hover:opacity-90"
                    : "border hover:border-foreground/25 hover:bg-muted",
                )}
              >
                {active.cta}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5 rtl:-scale-x-100" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!sent && !instant && (
          <p className="mt-2.5 text-[12.5px] text-muted-foreground">
            {dict.moverCard.manualPickup}
          </p>
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
