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
import { MODE_META } from "@/components/common/route-line";
import { Stars } from "@/components/common/stars";
import { BADGE_LABELS } from "@/lib/movers";
import { cityLabel } from "@/lib/geo";
import { formatDays, formatNumber, formatResponseTime } from "@/lib/format";
import type { ContactChannel, Mover, PublicQuote } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MoverTag = "best" | "fastest" | null;

const CHANNELS: Array<{
  id: ContactChannel;
  label: string;
  icon: typeof Phone;
  cta: string;
  done: string;
}> = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    cta: "Message on WhatsApp",
    done: "They'll message you on WhatsApp",
  },
  { id: "phone", label: "Call", icon: Phone, cta: "Request a call", done: "They'll call you" },
  { id: "email", label: "Email", icon: Mail, cta: "Ask by email", done: "They'll email you" },
];

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
  const [channel, setChannel] = useState<ContactChannel>(defaultChannel);
  const [sent, setSent] = useState(false);
  const instant = quote.kind === "instant";
  const { Icon: ModeIcon, label: modeLabel } = MODE_META[quote.mode];
  const active = CHANNELS.find((c) => c.id === channel)!;

  const connect = () => {
    setSent(true);
    toast.success(`Request sent to ${mover.name}`, { description: active.done });
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
              {tag === "best" && <Tag tone="brand">Best match</Tag>}
              {tag === "fastest" && <Tag>Fastest</Tag>}
              {instant && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] text-muted-foreground">
                  <Zap className="size-3" strokeWidth={2.5} />
                  Instant match
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars rating={mover.rating} count={mover.reviewCount} />
              <span className="text-[13.5px] text-muted-foreground">
                {cityLabel(mover.hqCity).split(",")[0]} · since {mover.since}
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
              <dt className="text-muted-foreground">Transit</dt>
              <dd className="mt-0.5 font-medium tnum">{formatDays(quote.transitDays)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Collection</dt>
              <dd className="mt-0.5 font-medium tnum">{quote.pickupWindow}</dd>
            </div>
            <div className="hidden lg:block">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="mt-0.5 font-medium tnum">{quote.deliveryWindow}</dd>
            </div>
          </dl>
        </div>

        {/* proof ---------------------------------------------------- */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-verify" />
            {Math.round(mover.onTimeRate * 100)}% on time
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Replies in {formatResponseTime(mover.responseMins)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Leaf className="size-3.5" />
            {formatNumber(quote.co2Kg)} kg CO₂e
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
                {BADGE_LABELS[badge].label}
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
                <span className="font-medium">Request sent.</span>{" "}
                <span className="text-muted-foreground">
                  {active.done} within {formatResponseTime(mover.responseMins)}.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Undo
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
                aria-label="How should they reach you?"
                className="flex rounded-full border bg-card p-1"
              >
                {CHANNELS.map((option) => {
                  const on = option.id === channel;
                  return (
                    <button
                      key={option.id}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setChannel(option.id)}
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
                      <option.icon className="relative size-3.5" strokeWidth={2} />
                      <span className="relative">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={connect}
                className={cn(
                  "group/cta ml-auto inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-medium transition-all duration-200 active:scale-[0.985]",
                  instant
                    ? "bg-ink text-background hover:opacity-90"
                    : "border hover:border-foreground/25 hover:bg-muted",
                )}
              >
                {active.cta}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!sent && !instant && (
          <p className="mt-2.5 text-[12.5px] text-muted-foreground">
            Picks up enquiries manually — usually replies the same day.
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
