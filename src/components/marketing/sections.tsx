import { Check, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/common/section";
import { Stars } from "@/components/common/stars";
import { RouteSearch } from "@/components/search/route-search";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { quote, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

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

        {/*
          Three steps, drawn as a sequence rather than as three boxes.

          The old version was three identical bordered cards with a 10px
          number buried between the icon and the title — which said "here are
          three features", not "here is what happens, in order". Two things
          carry the order now: a rail running behind the icons on desktop,
          turning down the left on a phone where the list is vertical; and a
          large ghosted numeral watermarked into each card, which is legible
          as a step count from across the room.

          The surface is the brand tint rather than plain card, so the band
          reads as one group. In dark mode the tint is darker than the card
          colour and would sink instead of lift, so the card colour stands.
        */}
        <ol className="relative mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-3 sm:gap-6">
          {/* The rail, at the icons' centre line. The cards are opaque, so
              what actually shows is a short connector in each gap — which is
              the same gesture the stacked phone layout makes vertically, and
              reads as "then" either way. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[16.6%] top-[calc(1.75rem+1.5rem)] hidden h-px bg-brand/35 sm:block"
          />

          {dict.how.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Search;
            const numeral = new Intl.NumberFormat(`${locale}-u-nu-latn`, {
              minimumIntegerDigits: 2,
            }).format(i + 1);

            return (
              <li
                key={step.title}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-brand/20 bg-brand-tint p-7",
                  "shadow-soft transition-shadow duration-300 hover:shadow-float",
                  "dark:border-border dark:bg-card",
                  // The vertical connector between stacked steps on a phone.
                  // Drawn from under this card to the top of the next, and
                  // suppressed on the last one, which has nothing to connect to.
                  "after:absolute after:bottom-[-1.25rem] after:start-[2.75rem] after:h-5 after:w-px after:bg-brand/35",
                  "last:after:hidden sm:after:hidden",
                )}
              >
                {/* Fully inside the card. Bled off the top edge it looked
                    like a clipping bug rather than a watermark — the eye
                    reads a cut numeral as a mistake, not as a crop. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute end-6 top-5 select-none text-[64px] font-semibold leading-none tracking-[-0.06em] text-brand/25 tnum dark:text-brand/15"
                >
                  {numeral}
                </span>

                <span className="relative grid size-12 place-items-center rounded-2xl bg-brand text-ink shadow-soft transition-transform duration-300 group-hover:scale-105">
                  <Icon className="size-5" strokeWidth={2} />
                </span>

                <h3 className="relative mt-7 text-[21px]">{step.title}</h3>
                <p className="relative mt-2 text-[15px] leading-relaxed text-muted-foreground">
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
