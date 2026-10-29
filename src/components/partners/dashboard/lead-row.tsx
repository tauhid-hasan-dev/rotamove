"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  CalendarDays,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  MessageCircle,
  Phone,
  Unlock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RouteLine } from "@/components/common/route-line";
import { PANEL_ROW } from "@/components/partners/dashboard/surface";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cityCountry, getCity, resolveCorridor } from "@/lib/geo";
import type { BoardLead, BoardStatus } from "@/lib/demo-leads";
import { seesMaskedLeads } from "@/lib/plans";
import type { UnlockRecord } from "@/lib/unlock-store";
import type { ContactChannel, PlanId } from "@/lib/types";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const CHANNEL_ICON: Record<ContactChannel, typeof Phone> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  all: MessageCircle,
};

/**
 * One enquiry on the partner board.
 *
 * Contact details are masked until the partner unlocks the lead. That is the
 * whole measurement: the gap between a lead landing and someone acting on it
 * is the number that tells a partner — and us — how fast they really are.
 *
 * Pro Unlimited partners still press unlock; they are just never charged for
 * it. Keeping the action identical on both plans is what makes the timing
 * comparable across the network.
 *
 * Pay-per-seen partners see less before they act: volume, access and the
 * route stay free, everything else is behind the unlock — and because the
 * click is the billable event, it goes to the server instead of being a
 * local reveal.
 */
export function LeadRow({
  item,
  plan,
  unlocked,
  onUnlock,
  now,
  email,
}: {
  item: BoardLead;
  plan: PlanId;
  unlocked: boolean;
  onUnlock: (id: string) => void;
  now: number;
  /** The signed-in partner's registered address — where leads are sent. */
  email: string;
}) {
  const { dict, t } = useI18n();
  const pd = dict.partnerDashboard;
  const [working, setWorking] = useState(false);
  const { lead } = item;
  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  const corridor = from && to ? resolveCorridor(from, to) : null;
  const mode = corridor?.modes[0] ?? "road";

  /**
   * Who has to pay to see this, and who already has it.
   *
   * Pro and Pay Per Lead are billed on the match, so the lead is theirs the
   * moment it lands: nothing is hidden, there is no button to press, and a
   * copy is already in their inbox. Only Pay Per Seen is billed on the open,
   * and only there does masking mean anything — hiding a lead someone has
   * already been charged for is just making them click.
   */
  const paysToOpen = seesMaskedLeads(plan);
  const revealed = !paysToOpen || unlocked || item.status === "unlocked";
  const status: BoardStatus = revealed ? "unlocked" : "new";
  const masked = paysToOpen && !revealed;
  const ChannelIcon = CHANNEL_ICON[lead.contact.channel];

  const unlock = async () => {
    setWorking(true);
    try {
      const response = await fetch("/api/partners/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(pd.row.toastError, {
          description: data?.error ?? pd.row.toastErrorBody,
        });
        return;
      }
      const { unlock: record } = (await response.json()) as { unlock: UnlockRecord };
      onUnlock(lead.id);
      toast.success(pd.row.toastUnlocked, {
        description: t.fill(pd.row.toastPerSeen, {
          fee: t.usd(record.feeUsd),
          email: record.emailTo,
        }),
      });
    } catch {
      toast.error(pd.row.toastError, { description: pd.row.toastErrorBody });
    } finally {
      setWorking(false);
    }
  };

  if (!from || !to) return null;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group p-4",
        PANEL_ROW,
        !revealed && "border-brand/70",
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* score ------------------------------------------------ */}
        <div className="flex shrink-0 flex-col items-center">
          <ScoreDial score={item.score} />
          <span className="mt-1.5 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
            {pd.row.quality}
          </span>
        </div>

        {/* body ------------------------------------------------- */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-[0.14em]",
                revealed ? "bg-verify/12 text-verify" : "bg-brand text-ink",
              )}
            >
              {status === "unlocked" ? pd.row.statusUnlocked : pd.row.statusNew}
            </span>
            <span className="text-[11px] text-muted-foreground tnum">
              {t.relative(now - item.ageMins * 60_000, now)}
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
                  {t.fill(pd.row.competitors, { n: item.competitors })}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="mt-2.5 max-w-md">
            <RouteLine
              from={from.code}
              to={to.code}
              mode={mode}
              modeLabel={dict.enums.modes[mode].label}
              size="sm"
            />
          </div>

          <p className="mt-1.5 truncate text-[13px] text-muted-foreground">
            {t.city(from, cityCountry(from).name)} → {t.city(to, cityCountry(to).name)}
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] text-muted-foreground tnum">
            <span className="inline-flex items-center gap-1.5">
              <Box className="size-3.5" />
              {t.volume(lead.volumeM3)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ArrowUpFromLine className="size-3.5" />
              {pd.row.collection}: {dict.enums.access[lead.origin.access].label}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ArrowDownToLine className="size-3.5" />
              {pd.row.delivery}: {dict.enums.access[lead.destination.access].label}
            </span>
            {!masked && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {t.dateShort(lead.moveDate)}
                </span>
                <span>{dict.enums.serviceLevel[lead.serviceLevel].label}</span>
                {lead.extras.storageWeeks > 0 && (
                  <span>{t.fill(pd.row.storageWeeksShort, { n: lead.extras.storageWeeks })}</span>
                )}
                {lead.extras.customsClearance && <span>{pd.row.customs}</span>}
              </>
            )}
          </dl>

          {!masked && lead.notes && (
            <p className="mt-3 border-s-2 border-border ps-3 text-[12.5px] italic leading-relaxed text-muted-foreground">
              “{lead.notes}”
            </p>
          )}
        </div>

        {/* contact ---------------------------------------------- */}
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[228px]">
          <div
            className={cn(
              "rounded-lg border p-3",
              revealed ? "bg-surface" : "border-dashed bg-muted/40",
            )}
          >
            {masked ? (
              /* Nothing identifying leaks on pay per seen — not even a name. */
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{pd.row.maskedTitle}</p>
                  <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                    {pd.row.maskedBody}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Reached only when the lead is revealed — on the two
                    match-billed plans that is immediately, and on pay per
                    seen it is after the unlock. Either way the contact is
                    paid for, so it is shown in full. */}
                <p className="truncate text-[13.5px] font-semibold">{lead.contact.fullName}</p>
                <p className="mt-1 truncate text-[12px] text-muted-foreground tnum">
                  {lead.contact.phone}
                </p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {lead.contact.email}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-brand">
                  <ChannelIcon className="size-3" />
                  {pd.row.prefers[lead.contact.channel]}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* action ------------------------------------------------- */}
      {/* Only pay per seen has anything to press. The other two were
          charged when the lead was matched, so an unlock button there was
          a paywall in front of something already bought. */}
      {paysToOpen ? (
        !revealed && (
          <div className="mt-3 flex flex-wrap items-center justify-end gap-3 border-t pt-3">
            <p className="me-auto text-[11.5px] text-muted-foreground">
              {pd.row.unlockHintSeen}
            </p>
            <button
              type="button"
              onClick={unlock}
              disabled={working}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985] disabled:opacity-70"
            >
              {working ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {pd.row.unlocking}
                </>
              ) : (
                <>
                  <Unlock className="size-3.5" />
                  {t.fill(pd.row.unlockFor, { fee: t.usd(item.feeUsd) })}
                </>
              )}
            </button>
          </div>
        )
      ) : (
        /* Instead of a button, the fact that matters: it is already in
           their inbox, so they know not to wait for this screen. */
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <MailCheck className="size-3.5 shrink-0 text-verify" aria-hidden />
          <p className="min-w-0 text-[11.5px] text-muted-foreground">
            {t.fill(pd.row.autoEmailed, { email })}
          </p>
          {plan === "pro_unlimited" ? (
            <span className="ms-auto text-[11.5px] text-verify">{pd.row.includedInPro}</span>
          ) : (
            <span className="ms-auto text-[11.5px] text-muted-foreground tnum">
              {t.fill(pd.row.billedPerLead, { fee: t.usd(item.feeUsd) })}
            </span>
          )}
        </div>
      )}
    </motion.article>
  );
}

/* The partial-contact maskers that used to live here are gone. They existed
   to tease a phone number at partners who had already been billed for it;
   now the only plan that hides anything hides all of it. */

function ScoreDial({ score }: { score: number }) {
  const { t, dict } = useI18n();
  const circumference = 2 * Math.PI * 18;
  const tone = score >= 75 ? "var(--verify)" : score >= 50 ? "var(--brand)" : "var(--muted-foreground)";
  return (
    <span
      className="relative grid size-12 place-items-center"
      aria-label={`${dict.partnerDashboard.row.quality} ${t.number(score)}`}
    >
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
