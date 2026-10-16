"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Box,
  CalendarDays,
  Eye,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Unlock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RouteLine } from "@/components/common/route-line";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cityCountry, getCity, resolveCorridor } from "@/lib/geo";
import { formatDateShort, formatRelative, formatUsdPrecise } from "@/lib/format";
import type { BoardLead, BoardStatus } from "@/lib/demo-leads";
import { cn } from "@/lib/utils";

const STATUS_META: Record<BoardStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-brand text-white" },
  unlocked: { label: "Unlocked", className: "bg-ink text-white dark:bg-[#2a2a33]" },
  contacted: { label: "Quoted", className: "border bg-background text-muted-foreground" },
  won: { label: "Won", className: "bg-verify text-white" },
  lost: { label: "Lost", className: "border bg-background text-muted-foreground line-through" },
};

const CHANNEL_ICON = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
} as const;

export function LeadRow({
  item,
  isPro,
  unlocked,
  onUnlock,
  now,
}: {
  item: BoardLead;
  isPro: boolean;
  unlocked: boolean;
  onUnlock: (id: string) => void;
  now: number;
}) {
  const [working, setWorking] = useState(false);
  const { lead } = item;
  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  const corridor = from && to ? resolveCorridor(from, to) : null;
  // A lead you already bought stays bought — only "new" leads are still locked
  // on the pay-per-lead plan.
  const alreadyBought = item.status !== "new";
  const revealed = isPro || unlocked || alreadyBought;
  const ChannelIcon = CHANNEL_ICON[lead.contact.channel];

  const unlock = async () => {
    setWorking(true);
    await new Promise((r) => setTimeout(r, 650));
    setWorking(false);
    onUnlock(lead.id);
    toast.success("Lead unlocked", {
      description: `${formatUsdPrecise(item.feeUsd)} charged to your wallet. Contact details are now visible.`,
    });
  };

  if (!from || !to) return null;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group rounded-xl border bg-card p-4 transition-shadow duration-300 hover:shadow-soft",
        item.status === "new" && "border-brand",
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* score ------------------------------------------------ */}
        <div className="flex shrink-0 flex-col items-center">
          <ScoreDial score={item.score} />
          <span className="mt-1.5 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
            quality
          </span>
        </div>

        {/* body ------------------------------------------------- */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-[0.14em]",
                STATUS_META[item.status].className,
              )}
            >
              {STATUS_META[item.status].label}
            </span>
            <span className="text-[11px] text-muted-foreground tnum">
              {formatRelative(now - item.ageMins * 60_000, now)}
            </span>
            {item.competitors > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help items-center gap-1 text-[11px] text-foreground tnum">
                    <Users className="size-3" />
                    {item.competitors}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {item.competitors} other partners have this lead. Speed wins it.
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="mt-2.5 max-w-md">
            <RouteLine from={from.code} to={to.code} mode={corridor?.modes[0] ?? "road"} size="sm" />
          </div>

          <p className="mt-1.5 truncate text-[13px] text-muted-foreground">
            {from.name}, {cityCountry(from).name} → {to.name}, {cityCountry(to).name}
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] text-muted-foreground tnum">
            <span className="inline-flex items-center gap-1.5">
              <Box className="size-3.5" />
              {lead.volumeM3} m³
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDateShort(lead.moveDate)}
            </span>
            <span className="capitalize">{lead.serviceLevel.replace(/_/g, " ")}</span>
            {lead.extras.storageWeeks > 0 && <span>storage {lead.extras.storageWeeks}w</span>}
            {lead.extras.customsClearance && <span>customs</span>}
          </dl>

          {lead.notes && (
            <p className="mt-3 border-l-2 border-border pl-3 text-[12.5px] italic leading-relaxed text-muted-foreground">
              “{lead.notes}”
            </p>
          )}
        </div>

        {/* contact / action ------------------------------------- */}
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[228px]">
          <div
            className={cn(
              "rounded-lg border p-3",
              revealed ? "bg-surface" : "border-dashed bg-muted/40",
            )}
          >
            {revealed ? (
              <>
                <p className="truncate text-[13.5px] font-semibold">{lead.contact.fullName}</p>
                <p className="mt-1 truncate text-[12px] text-muted-foreground tnum">
                  {lead.contact.phone}
                </p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {lead.contact.email}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-brand">
                  <ChannelIcon className="size-3" />
                  prefers {lead.contact.channel}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium">Contact hidden</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground tnum">
                    unlock for {formatUsdPrecise(item.feeUsd)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {revealed ? (
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="size-3.5" />
              Open & quote
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={unlock} disabled={working}>
              <Unlock className="size-3.5" />
              {working ? "Unlocking…" : `Unlock ${formatUsdPrecise(item.feeUsd)}`}
            </Button>
          )}

          {isPro ? (
            <p className="text-center text-[10px] uppercase tracking-[0.12em] text-verify">
              included in Pro
            </p>
          ) : (
            alreadyBought && (
              <p className="text-center text-[10px] uppercase tracking-[0.12em] text-muted-foreground tnum">
                paid {formatUsdPrecise(item.feeUsd)}
              </p>
            )
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ScoreDial({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 18;
  const tone = score >= 75 ? "var(--verify)" : score >= 50 ? "var(--brand)" : "var(--bid)";
  return (
    <span className="relative grid size-12 place-items-center" aria-label={`Quality score ${score}`}>
      <svg viewBox="0 0 44 44" className="absolute size-12 -rotate-90">
        <circle cx="22" cy="22" r="18" className="fill-none stroke-border" strokeWidth="3.5" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke={tone}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <span className="relative text-[13px] font-medium tnum">{score}</span>
    </span>
  );
}
