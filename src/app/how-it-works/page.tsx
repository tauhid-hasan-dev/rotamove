import type { Metadata } from "next";
import {
  Building2,
  Clock3,
  Gauge,
  MessageCircle,
  ScrollText,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { CtaBand, Faq } from "@/components/marketing/sections";
import { NETWORK_PARTNER_CLAIM } from "@/lib/movers";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Rotamove matches you with movers, how the ranking is weighted, and what every partner has to prove.",
};

const STEPS = [
  { icon: Search, title: "Search", body: "One box: where from, where to." },
  { icon: Clock3, title: "Match", body: "We poll the network. Takes about eight seconds." },
  { icon: MessageCircle, title: "Talk", body: "Choose the channel. Only your picks get in touch." },
];

const RANKING = [
  { weight: 36, label: "Route fit", icon: ShieldCheck },
  { weight: 24, label: "Review score", icon: Star },
  { weight: 16, label: "On-time record", icon: Gauge },
  { weight: 14, label: "Transit speed", icon: Clock3 },
  { weight: 10, label: "Response time", icon: MessageCircle },
];

const CHECKS = [
  { icon: ScrollText, title: "Licence", body: "Transport licence and registration, checked against the national register." },
  { icon: ShieldCheck, title: "Insurance", body: "Valid CMR and all-risk transit cover." },
  { icon: Gauge, title: "Claims history", body: "Tracked continuously. Above threshold and you leave the board." },
  { icon: Building2, title: "Real operation", body: "A depot, a fleet, named staff. No brokers." },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="relative pb-12 pt-16 sm:pt-24">
          <div
            className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[520px] opacity-75 glow-brand"
            aria-hidden
          />
          <Shell>
            <h1 className="mx-auto max-w-3xl text-center text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.0] tracking-[-0.045em]">
              A marketplace only works if you can see how it decides.
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-center text-[17px] leading-relaxed text-muted-foreground">
              So here is the ranking, and the checklist every mover has to pass.
            </p>
          </Shell>
        </section>

        <section className="py-20">
          <Shell>
            <ol className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-3xl border bg-card p-7">
                  <span className="grid size-11 place-items-center rounded-full bg-brand text-ink">
                    <step.icon className="size-[18px]" strokeWidth={2} />
                  </span>
                  <p className="mt-6 text-[11.5px] font-medium tabular-nums text-muted-foreground">
                    0{i + 1}
                  </p>
                  <h2 className="mt-1 text-[21px]">{step.title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </Shell>
        </section>

        <section id="ranking" className="py-20">
          <Shell>
            <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05]">
                  Five inputs. Published weights.
                </h2>
                <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
                  No mover can pay for a better position. Our fee is identical whoever you choose.
                </p>
              </div>

              <ul className="space-y-2.5">
                {RANKING.map((item) => (
                  <li key={item.label} className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4 shrink-0" strokeWidth={2} />
                      <span className="text-[15px] font-medium">{item.label}</span>
                      <span className="ml-auto text-[15px] font-medium tnum">{item.weight}%</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${(item.weight / 36) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Shell>
        </section>

        <section id="trust" className="py-20">
          <Shell>
            <h2 className="mx-auto max-w-2xl text-center text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05]">
              What all {NETWORK_PARTNER_CLAIM} partners had to prove.
            </h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHECKS.map((check) => (
                <div key={check.title} className="rounded-3xl border bg-card p-6">
                  <check.icon className="size-5" strokeWidth={2} />
                  <h3 className="mt-5 text-[17px]">{check.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                    {check.body}
                  </p>
                </div>
              ))}
            </div>
          </Shell>
        </section>

        <section id="about" className="py-20">
          <Shell>
            <div className="mx-auto max-w-2xl space-y-5 text-[16px] leading-relaxed text-muted-foreground">
              <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05] text-foreground">
                Why corridors, not countries.
              </h2>
              <p>
                Moving between Türkiye and Europe is one of the densest household flows in the
                world, and almost none of it is searchable. The lanes into the CIS, Central Asia
                and the Gulf are worse — a handful of operators really run them.
              </p>
              <p>
                Rotamove picks a small number of corridors and goes deep. Fewer routes, real
                partners, verified every year.
              </p>
              <p className="text-foreground">Istanbul · Berlin · Tashkent</p>
            </div>
          </Shell>
        </section>

        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
