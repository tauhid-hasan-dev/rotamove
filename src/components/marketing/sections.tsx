import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/common/section";
import { Stars } from "@/components/common/stars";
import { RouteSearch } from "@/components/search/route-search";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LEAD_FEE_CAP_USD, PRO_MONTHLY_USD } from "@/lib/plans";
import { quote, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatUsd } from "@/i18n/format";
import { cn } from "@/lib/utils";
import { localePath } from "@/i18n/paths";

type SectionProps = { dict: Dictionary; locale: Locale };

/* ------------------------------------------------------- trust strip -- */

/** Accreditation bodies are proper nouns — FIDI is FIDI in every language. */
const ACCREDITATIONS = ["FIDI / FAIM", "IAM", "AMÖ", "BAR", "IATA", "ISO 9001", "TOBB"];

export function TrustStrip({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-y bg-surface py-6">
      <Shell>
        <ul className="mask-fade-x flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
          <li className="eyebrow">{dict.trust.label}</li>
          {ACCREDITATIONS.map((item) => (
            <li key={item} className="text-[13.5px] font-medium text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------ how it works -- */

const STEP_ICONS = [Search, ShieldCheck, MessageCircle];

export function HowItWorks({ dict, locale }: SectionProps) {
  return (
    <section className="py-24 sm:py-32">
      <Shell>
        <h2 className="mx-auto max-w-xl text-center text-[clamp(2rem,4vw,3rem)] leading-[1.02]">
          {dict.how.title}
        </h2>

        <ol className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
          {dict.how.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Search;
            return (
              <li
                key={step.title}
                className="rounded-3xl border bg-card p-7 transition-shadow duration-300 hover:shadow-soft"
              >
                <span className="grid size-11 place-items-center rounded-full bg-brand text-ink">
                  <Icon className="size-[18px]" strokeWidth={2} />
                </span>
                <p className="mt-6 text-[11.5px] font-medium tabular-nums text-muted-foreground">
                  {new Intl.NumberFormat(`${locale}-u-nu-latn`, {
                    minimumIntegerDigits: 2,
                  }).format(i + 1)}
                </p>
                <h3 className="mt-1 text-[21px]">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------ testimonials -- */

/** Visual identity only — paired positionally with the translated quotes. */
const FACES = [
  { accent: "#2E5E4E", monogram: "AK" },
  { accent: "#7A5A12", monogram: "RA" },
  { accent: "#3B3B6B", monogram: "JR" },
];

export function Testimonials({ dict, locale }: SectionProps) {
  return (
    <section className="py-24 sm:py-32">
      <Shell>
        <h2 className="mx-auto max-w-xl text-center text-[clamp(2rem,4vw,3rem)] leading-[1.02]">
          {dict.testimonials.title}
        </h2>

        <div className="mx-auto mt-14 grid max-w-6xl gap-4 lg:grid-cols-3">
          {dict.testimonials.items.map((item, i) => {
            const face = FACES[i] ?? FACES[0];
            return (
              <figure key={item.name} className="flex flex-col rounded-3xl border bg-card p-7">
                <Stars rating={5} compact />
                <blockquote className="mt-5 flex-1 text-[17px] leading-relaxed">
                  {/* Quotation marks follow the locale's own convention:
                      „…“ in German, «…» in French and Russian. */}
                  {quote(locale, item.quote)}
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
                    style={{ backgroundColor: face.accent }}
                    aria-hidden
                  >
                    {face.monogram}
                  </span>
                  <span>
                    <span className="block text-[14px] font-medium">{item.name}</span>
                    <span className="block text-[13px] text-muted-foreground">{item.route}</span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Shell>
    </section>
  );
}

/* ---------------------------------------------------- partner teaser -- */

export function PartnerTeaser({ dict, locale }: SectionProps) {
  const cap = formatUsd(locale, LEAD_FEE_CAP_USD);

  return (
    <section className="py-24 sm:py-32">
      <Shell>
        <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-3xl bg-surface px-7 py-12 sm:px-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">{dict.partnerTeaser.eyebrow}</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.04]">
              {dict.partnerTeaser.title}
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              {dict.partnerTeaser.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href={localePath(locale, "/partners")}>
                  {dict.partnerTeaser.pricingCta}
                  <ArrowRight className="size-4 rtl:-scale-x-100" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href={localePath(locale, "/partners/dashboard")}>
                  {dict.partnerTeaser.demoCta}
                </Link>
              </Button>
            </div>
          </div>

          {/* All three plans. The pair that used to sit here contradicted
              the pricing page the CTA below leads to. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <PlanTile
              price={formatUsd(locale, PRO_MONTHLY_USD)}
              unit={dict.partnerTeaser.proUnit}
              title={dict.plans.proName}
              body={dict.partnerTeaser.proBody}
              highlight
            />
            <PlanTile
              price={`${formatUsd(locale, 2)}–${cap}`}
              unit={dict.partnerTeaser.pplUnit}
              title={dict.plans.pplName}
              body={fill(dict.partnerTeaser.pplBody, { cap })}
            />
            <PlanTile
              className="sm:col-span-2"
              price={`${formatUsd(locale, 2)}–${cap}`}
              unit={dict.partnerTeaser.ppsUnit}
              title={dict.plans.ppsName}
              body={fill(dict.partnerTeaser.ppsBody, { cap })}
            />
          </div>
        </div>
      </Shell>
    </section>
  );
}

function PlanTile({
  price,
  unit,
  title,
  body,
  highlight,
  className,
}: {
  price: string;
  unit: string;
  title: string;
  body: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        highlight ? "rounded-3xl bg-brand p-6 text-ink" : "rounded-3xl border bg-card p-6",
        className,
      )}
    >
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] opacity-70">{title}</p>
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-[30px] font-semibold tracking-[-0.04em] tnum">{price}</span>
        <span className="text-[13px] opacity-60">{unit}</span>
      </p>
      <p className="mt-3 text-[14px] leading-relaxed opacity-75">{body}</p>
    </div>
  );
}

/* ----------------------------------------------------------------- faq -- */

export function Faq({ dict }: { dict: Dictionary }) {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <Shell>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-[clamp(2rem,4vw,3rem)] leading-[1.02]">
            {dict.faq.title}
          </h2>
          <Accordion type="single" collapsible className="mt-12 w-full">
            {dict.faq.items.map((item, i) => (
              <AccordionItem key={item.q} value={`q-${i}`} className="border-b">
                <AccordionTrigger className="py-5 text-start text-[17px] font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------ cta band -- */

export function CtaBand({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative z-20 pb-24 pt-8 sm:pb-32">
      <Shell>
        <div className="mx-auto max-w-4xl rounded-3xl bg-brand px-7 py-16 text-center text-ink sm:px-12 sm:py-20">
          <h2 className="text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.02]">{dict.ctaBand.title}</h2>
          <div className="mx-auto mt-9 max-w-2xl">
            <RouteSearch size="md" />
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-[14px] opacity-70">
            <Check className="size-4" strokeWidth={2.5} />
            {dict.common.free}
          </p>
        </div>
      </Shell>
    </section>
  );
}
