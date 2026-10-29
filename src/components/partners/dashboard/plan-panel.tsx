"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Eye, Infinity as InfinityIcon, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PANEL } from "@/components/partners/dashboard/surface";
import { useI18n } from "@/i18n/provider";
import type { PlanSubscription } from "@/lib/plan-store";
import { LEAD_FEE_CAP_USD, LEAD_FEE_FLOOR_USD, PLAN_IDS, PRO_MONTHLY_USD } from "@/lib/plans";
import type { PlanId } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The partner's plan: what it is, and how to change it.
 *
 * Changing is a request, not a toggle. The dashboard used to carry a
 * three-way pill that flipped the plan in local state — convenient for a
 * demo and wrong in every other way: it let a partner move onto
 * pay-per-unlock halfway through a month they had already been billed a
 * flat fee for, and it forgot the choice on refresh because nothing
 * recorded it. Now the plan comes from the server, the change is queued for
 * the first of next month, and the partner has to read what that means
 * before confirming.
 */

const PLAN_ICONS: Record<PlanId, typeof InfinityIcon> = {
  pro_unlimited: InfinityIcon,
  pay_per_lead: Ticket,
  pay_per_seen: Eye,
};

export function PlanPanel({
  subscription,
  compact = false,
}: {
  subscription: PlanSubscription;
  /** The mobile strip, where there is no room for the pending-change line. */
  compact?: boolean;
}) {
  const { dict, t } = useI18n();
  const pd = dict.partnerDashboard;
  const px = pd.planChange;
  const [open, setOpen] = useState(false);

  const plan = subscription.plan;
  const Icon = PLAN_ICONS[plan];

  const price =
    plan === "pro_unlimited"
      ? t.fill(px.pricePro, { amount: t.usd(PRO_MONTHLY_USD) })
      : t.fill(plan === "pay_per_seen" ? px.pricePps : px.pricePpl, {
          floor: t.usd(LEAD_FEE_FLOOR_USD),
          cap: t.usd(LEAD_FEE_CAP_USD),
        });

  /*
   * The compact strip, for the phone layout where the sidebar collapses.
   * Pill and button on one line, both sized by their content.
   */
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-[12.5px] font-medium">
          <Icon className="size-3.5 text-brand" />
          {pd.planNames[plan]}
        </span>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)}>
          {px.changeCta}
        </Button>
        <ChangePlanDialog open={open} onOpenChange={setOpen} subscription={subscription} />
      </div>
    );
  }

  /*
   * One card, one width.
   *
   * This used to be a content-width pill floating above a full-width button,
   * which in a 228px sidebar read as two unrelated controls of two different
   * sizes — the pill ended two thirds of the way across and the button ran
   * to the edge under it. Everything now sits inside a single bordered block
   * and shares its measure: the plan names it, the price qualifies it, and
   * the button spans the same width as both.
   */
  return (
    <div className={cn(PANEL, "p-4")}>
      <p className="flex items-center gap-2 text-[14px] font-medium">
        <Icon className="size-4 shrink-0 text-brand" aria-hidden />
        <span className="min-w-0 truncate">{pd.planNames[plan]}</span>
      </p>
      <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground tnum">{price}</p>

      <Button
        variant="outline"
        size="sm"
        className="mt-3.5 w-full rounded-full"
        onClick={() => setOpen(true)}
      >
        {px.changeCta}
      </Button>

      {/* The queued change, where there is room to say it properly. */}
      {subscription.pendingPlan && subscription.effectiveFrom && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5 text-[12px] leading-snug text-muted-foreground">
          <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
          <span>
            {t.fill(px.pendingLine, {
              plan: pd.planNames[subscription.pendingPlan],
              date: t.dateLong(subscription.effectiveFrom),
            })}
          </span>
        </p>
      )}

      <ChangePlanDialog open={open} onOpenChange={setOpen} subscription={subscription} />
    </div>
  );
}

function ChangePlanDialog({
  open,
  onOpenChange,
  subscription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: PlanSubscription;
}) {
  const { dict, t, href } = useI18n();
  const pd = dict.partnerDashboard;
  const px = pd.planChange;
  const router = useRouter();

  // Pre-selected to whatever is already queued, so reopening the dialog
  // shows the decision the partner last made rather than resetting it.
  const [choice, setChoice] = useState<PlanId>(subscription.pendingPlan ?? subscription.plan);
  const [working, setWorking] = useState(false);

  const priceFor = (plan: PlanId) =>
    plan === "pro_unlimited"
      ? t.fill(px.pricePro, { amount: t.usd(PRO_MONTHLY_USD) })
      : t.fill(plan === "pay_per_seen" ? px.pricePps : px.pricePpl, {
          floor: t.usd(LEAD_FEE_FLOOR_USD),
          cap: t.usd(LEAD_FEE_CAP_USD),
        });

  const unchanged = choice === subscription.plan && !subscription.pendingPlan;

  const submit = async () => {
    setWorking(true);
    try {
      // Same plan as today means "withdraw my request", which the API
      // treats as a cancel rather than queueing a change to nothing.
      const cancelling = choice === subscription.plan;
      const response = await fetch("/api/partners/plan", {
        method: cancelling ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(cancelling ? {} : { body: JSON.stringify({ plan: choice }) }),
      });
      if (!response.ok) throw new Error("plan change failed");

      const { subscription: next } = (await response.json()) as {
        subscription: PlanSubscription;
      };

      if (next.pendingPlan && next.effectiveFrom) {
        toast.success(px.toastQueued, {
          description: t.fill(px.toastQueuedBody, {
            plan: pd.planNames[next.pendingPlan],
            date: t.dateLong(next.effectiveFrom),
          }),
        });
      } else {
        toast.success(px.toastCancelled);
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(px.toastFailed);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{px.title}</DialogTitle>
          <DialogDescription>{px.lede}</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label={px.title} className="space-y-2">
          {PLAN_IDS.map((plan) => {
            const Icon = PLAN_ICONS[plan];
            const selected = choice === plan;
            const current = plan === subscription.plan;
            return (
              <button
                key={plan}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setChoice(plan)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-start transition-colors",
                  selected ? "border-brand bg-brand-tint dark:bg-accent" : "hover:border-foreground/25",
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium">{pd.planNames[plan]}</span>
                    {current && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        {px.currentBadge}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-muted-foreground tnum">
                    {priceFor(plan)}
                  </span>
                  <span className="mt-1.5 block text-[12.5px] leading-snug text-muted-foreground">
                    {px.planNotes[plan]}
                  </span>
                </span>
                {selected && <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        {/* The terms. Short, specific to what is about to happen, and above
            the button that accepts them — not behind a link nobody opens. */}
        <div className="rounded-2xl border border-dashed bg-surface p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {px.termsHeading}
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            <li>{px.term1}</li>
            <li>{px.term2}</li>
            <li>{px.term3}</li>
          </ul>
          <Link
            href={href("/terms")}
            className="mt-3 inline-block text-[12.5px] underline decoration-brand decoration-2 underline-offset-4"
          >
            {px.fullTerms}
          </Link>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {dict.admin.common.cancel}
          </Button>
          <Button onClick={submit} disabled={working || unchanged}>
            {working && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {choice === subscription.plan && subscription.pendingPlan
              ? px.agreeCancel
              : px.agree}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
