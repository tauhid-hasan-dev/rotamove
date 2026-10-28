import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDateLong } from "@/i18n/format";
import { fill } from "@/i18n/format";
import { localePath } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

/**
 * The shared shell for the privacy policy and the terms.
 *
 * One component because the two pages differ only in their copy, and a
 * legal page that formats differently from its sibling looks like it was
 * written by a different company.
 */

/**
 * When the text last changed.
 *
 * A literal, not `new Date()`: the date a policy was last revised is a fact
 * about the document, and rendering today's date would tell every reader it
 * changed this morning.
 */
export const LEGAL_UPDATED = "2026-10-28";

export interface LegalSection {
  heading: string;
  body: string;
}

export function LegalPage({
  dict,
  locale,
  title,
  lede,
  sections,
}: {
  dict: Dictionary;
  locale: Locale;
  title: string;
  lede: string;
  sections: readonly LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Shell className="pt-12 pb-24 sm:pt-16">
          <div className="mx-auto max-w-[46rem]">
            <p className="eyebrow">{dict.legal.eyebrow}</p>
            <h1 className="mt-4 text-[clamp(2rem,4.4vw,2.9rem)] leading-[1.05] tracking-[-0.04em]">
              {title}
            </h1>
            <p className="mt-4 text-[16.5px] leading-relaxed text-muted-foreground">{lede}</p>
            <p className="tnum mt-6 text-[13px] text-muted-foreground">
              {fill(dict.legal.updated, { date: formatDateLong(locale, LEGAL_UPDATED) })}
            </p>

            {/* The demo notice sits above the text, not in a footnote. A
                reader is entitled to know before they read it that this is
                scaffolding for a prototype and not a policy anyone has
                signed off. */}
            <p className="mt-8 rounded-2xl border border-dashed bg-surface p-4 text-[14px] leading-relaxed text-muted-foreground">
              {dict.legal.draftNotice}
            </p>

            <div className="mt-10 space-y-9">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-[19px] leading-snug tracking-[-0.02em]">
                    {section.heading}
                  </h2>
                  <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-3xl bg-surface p-7">
              <h2 className="text-[19px] leading-snug tracking-[-0.02em]">
                {dict.legal.contactHeading}
              </h2>
              <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted-foreground">
                {dict.legal.contactBody}
              </p>
              <Link
                href={localePath(locale, "/partners#contact")}
                className="group mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline"
              >
                {dict.legal.contactCta}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
