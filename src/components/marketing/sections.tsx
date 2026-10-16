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

/* ------------------------------------------------------- trust strip -- */

const ACCREDITATIONS = ["FIDI / FAIM", "IAM", "AMÖ", "BAR", "IATA", "ISO 9001", "TOBB"];

export function TrustStrip() {
  return (
    <section className="border-y bg-surface py-6">
      <Shell>
        <ul className="mask-fade-x flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
          <li className="eyebrow">Accredited partners only</li>
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

const STEPS = [
  { icon: Search, title: "Search", body: "One box. Where from, where to." },
  { icon: ShieldCheck, title: "Match", body: "We find movers who actually run your route." },
  { icon: MessageCircle, title: "Talk", body: "Pick WhatsApp, a call or email. They reach out." },
];

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32">
      <Shell>
        <h2 className="mx-auto max-w-xl text-center text-[clamp(2rem,4vw,3rem)] leading-[1.02]">
          Three steps. No phone tag.
        </h2>

        <ol className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-3xl border bg-card p-7 transition-shadow duration-300 hover:shadow-soft"
            >
              <span className="grid size-11 place-items-center rounded-full bg-brand text-ink">
                <step.icon className="size-[18px]" strokeWidth={2} />
              </span>
              <p className="mt-6 text-[11.5px] font-medium tabular-nums text-muted-foreground">
                0{i + 1}
              </p>
              <h3 className="mt-1 text-[21px]">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------ testimonials -- */

const TESTIMONIALS = [
  {
    quote: "Four movers messaged me on WhatsApp the same afternoon. I picked one by evening.",
    name: "Aylin K.",
    route: "Istanbul → Berlin",
    rating: 5,
    accent: "#2E5E4E",
    monogram: "AK",
  },
  {
    quote: "They found operators who genuinely run the Caspian crossing. Nobody else could.",
    name: "Rustam A.",
    route: "Tashkent → Istanbul",
    rating: 5,
    accent: "#7A5A12",
    monogram: "RA",
  },
  {
    quote: "No forms, no spam. One search and the right people got in touch.",
    name: "Jonas R.",
    route: "Stockholm → Izmir",
    rating: 5,
    accent: "#3B3B6B",
    monogram: "JR",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <Shell>
        <h2 className="mx-auto max-w-xl text-center text-[clamp(2rem,4vw,3rem)] leading-[1.02]">
          24,800 moves, and counting.
        </h2>

        <div className="mx-auto mt-14 grid max-w-6xl gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="flex flex-col rounded-3xl border bg-card p-7">
              <Stars rating={item.rating} compact />
              <blockquote className="mt-5 flex-1 text-[17px] leading-relaxed">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
                  style={{ backgroundColor: item.accent }}
                  aria-hidden
                >
                  {item.monogram}
                </span>
                <span>
                  <span className="block text-[14px] font-medium">{item.name}</span>
                  <span className="block text-[13px] text-muted-foreground">{item.route}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Shell>
    </section>
  );
}

/* ----------------------------------------------------- partner teaser -- */

export function PartnerTeaser() {
  return (
    <section className="py-24 sm:py-32">
      <Shell>
        <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-3xl bg-surface px-7 py-12 sm:px-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">For moving companies</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.04]">
              Buy demand, not phone numbers.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              Flat monthly, or pay per lead with a hard ceiling. Nothing else.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/partners">
                  Partner pricing
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/partners/dashboard">See the demo</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PlanTile
              price={`$${PRO_MONTHLY_USD}`}
              unit="/ month"
              title="Pro Unlimited"
              body="Every lead, unlimited. Instant placement in search."
              highlight
            />
            <PlanTile
              price={`$2–$${LEAD_FEE_CAP_USD}`}
              unit="/ lead"
              title="Pay Per Lead"
              body={`No subscription. Never more than $${LEAD_FEE_CAP_USD}.`}
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
}: {
  price: string;
  unit: string;
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-3xl bg-brand p-6 text-ink"
          : "rounded-3xl border bg-card p-6"
      }
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

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes, always. Movers pay us a flat monthly fee or a small capped fee per lead — never a commission on your move, so no one can pay for a better position.",
  },
  {
    q: "Will I get spam calls?",
    a: "No. You choose the channel — WhatsApp, a call or email — and your details only go to the movers you pick.",
  },
  {
    q: "Which routes do you cover?",
    a: "Türkiye to and from Europe, the Balkans, Scandinavia, the CIS and Caucasus, Central Asia and the Middle East — plus domestic moves in all 53 partner countries.",
  },
  {
    q: "How are movers verified?",
    a: "Transport licence, insurance, claims history and a real depot, re-checked every year. Fail and you leave the network.",
  },
  {
    q: "How fast do they reply?",
    a: "Instant-match partners typically respond within fifteen minutes. The rest come back the same day.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <Shell>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-[clamp(2rem,4vw,3rem)] leading-[1.02]">Questions</h2>
          <Accordion type="single" collapsible className="mt-12 w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`q-${i}`} className="border-b">
                <AccordionTrigger className="py-5 text-left text-[17px] font-medium hover:no-underline">
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

export function CtaBand() {
  return (
    <section className="relative z-20 pb-24 pt-8 sm:pb-32">
      <Shell>
        <div className="mx-auto max-w-4xl rounded-3xl bg-brand px-7 py-16 text-center text-ink sm:px-12 sm:py-20">
          <h2 className="text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.02]">
            Where are you moving?
          </h2>
          <div className="mx-auto mt-9 max-w-2xl">
            <RouteSearch size="md" />
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-[14px] opacity-70">
            <Check className="size-4" strokeWidth={2.5} />
            Free · no account · no cold calls
          </p>
        </div>
      </Shell>
    </section>
  );
}
