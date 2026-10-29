import Link from "next/link";
import { Check, Minus } from "lucide-react";
import {
  LEAD_FEE_CAP_USD,
  LEAD_FEE_FLOOR_USD,
  PPL_FEATURE_INCLUDED,
  PPS_FEATURE_INCLUDED,
  PRO_MONTHLY_USD,
} from "@/lib/plans";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatUsd } from "@/i18n/format";
import { localePath } from "@/i18n/paths";
import { cn } from "@/lib/utils";

export function PricingPlans({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const cap = formatUsd(locale, LEAD_FEE_CAP_USD);

  /*
   * One destination, and it is the sign-up form.
   *
   * The three cards used to carry three different promises — "Start 14-day
   * free trial", "Create free partner account", "Create free partner
   * account" — and all three opened the demo dashboard, which is neither a
   * trial nor an account. One label on one door is honest about what the
   * button does, and it is the same door whichever plan brought you to it:
   * the plan is chosen inside the account, not by which button you pressed.
   */
  const register = localePath(locale, "/partners/register");

  const plans = [
    {
      id: "pro_unlimited",
      name: dict.plans.proName,
      priceLabel: formatUsd(locale, PRO_MONTHLY_USD),
      priceSuffix: dict.plans.proSuffix,
      priceNote: dict.plans.proNote,
      featured: true,
      // Pro includes the lot, which is the point of the tier.
      features: dict.plans.proFeatures.map((label) => ({ label, included: true })),
    },
    {
      id: "pay_per_lead",
      name: dict.plans.pplName,
      priceLabel: `${formatUsd(locale, LEAD_FEE_FLOOR_USD)}–${cap}`,
      priceSuffix: dict.plans.pplSuffix,
      priceNote: fill(dict.plans.pplNote, { cap }),
      featured: false,
      // Labels translate; entitlements come from the plan model, not the copy.
      features: dict.plans.pplFeatures.map((label, i) => ({
        label,
        included: PPL_FEATURE_INCLUDED[i] ?? true,
      })),
    },
    {
      id: "pay_per_seen",
      name: dict.plans.ppsName,
      priceLabel: `${formatUsd(locale, LEAD_FEE_FLOOR_USD)}–${cap}`,
      priceSuffix: dict.plans.ppsSuffix,
      priceNote: fill(dict.plans.ppsNote, { cap }),
      featured: false,
      features: dict.plans.ppsFeatures.map((label, i) => ({
        label,
        included: PPS_FEATURE_INCLUDED[i] ?? true,
      })),
    },
  ];

  return (
    <div id="plans" className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "flex flex-col rounded-3xl p-8 sm:p-9",
            plan.featured ? "bg-brand text-ink" : "border bg-card",
          )}
        >
          <div className="flex items-center gap-3">
            <h3 className="text-[20px] font-semibold tracking-[-0.03em]">{plan.name}</h3>
            {plan.featured && (
              <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-[11.5px] font-medium">
                {dict.plans.mostChosen}
              </span>
            )}
          </div>

          <p className="mt-6 flex items-baseline gap-2">
            <span className="text-[clamp(2.6rem,5vw,3.4rem)] font-semibold leading-none tracking-[-0.05em] tnum">
              {plan.priceLabel}
            </span>
            <span
              className={cn("text-[14px]", plan.featured ? "opacity-60" : "text-muted-foreground")}
            >
              {plan.priceSuffix}
            </span>
          </p>

          <p
            className={cn(
              "mt-3 text-[14px] leading-relaxed",
              plan.featured ? "opacity-70" : "text-muted-foreground",
            )}
          >
            {plan.priceNote}
          </p>

          <Link
            href={register}
            className={cn(
              "mt-8 rounded-full py-3.5 text-center text-[15.5px] font-medium transition-all duration-200 active:scale-[0.985]",
              plan.featured ? "bg-ink text-background hover:opacity-90" : "border hover:bg-muted",
            )}
          >
            {dict.plans.getStarted}
          </Link>

          <ul className="mt-9 space-y-3">
            {plan.features.map((feature) => (
              <li
                key={feature.label}
                className={cn("flex items-start gap-3", !feature.included && "opacity-45")}
              >
                <span className="mt-[3px] shrink-0">
                  {feature.included ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Minus className="size-4" strokeWidth={2.5} />
                  )}
                </span>
                <span className="text-[14.5px] leading-snug">{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
