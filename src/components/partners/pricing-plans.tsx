import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingPlans() {
  return (
    <div id="plans" className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2">
      {PLANS.map((plan) => {
        const featured = Boolean(plan.recommended);
        return (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-3xl p-8 sm:p-9",
              featured ? "bg-brand text-ink" : "border bg-card",
            )}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-[20px] font-semibold tracking-[-0.03em]">{plan.name}</h3>
              {featured && (
                <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-[11.5px] font-medium">
                  Most chosen
                </span>
              )}
            </div>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-[clamp(2.6rem,5vw,3.4rem)] font-semibold leading-none tracking-[-0.05em] tnum">
                {plan.priceLabel}
              </span>
              <span className={cn("text-[14px]", featured ? "opacity-60" : "text-muted-foreground")}>
                {plan.priceSuffix}
              </span>
            </p>

            <p
              className={cn(
                "mt-3 text-[14px] leading-relaxed",
                featured ? "opacity-70" : "text-muted-foreground",
              )}
            >
              {plan.priceNote}
            </p>

            <Link
              href="/partners/dashboard"
              className={cn(
                "mt-8 rounded-full py-3.5 text-center text-[15.5px] font-medium transition-all duration-200 active:scale-[0.985]",
                featured
                  ? "bg-ink text-background hover:opacity-90"
                  : "border hover:bg-muted",
              )}
            >
              {plan.cta}
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
        );
      })}
    </div>
  );
}
