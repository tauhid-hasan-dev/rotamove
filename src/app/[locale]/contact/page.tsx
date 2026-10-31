import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Eyebrow, Shell } from "@/components/common/section";
import { ContactForm } from "@/components/contact/contact-form";
import { SUPPORT_EMAIL } from "@/lib/mail";
import { turnstileSiteKey, usingTestKeys } from "@/lib/turnstile";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.meta.contactTitle,
    description: dict.meta.contactDescription,
    alternates: {
      canonical: localePath(locale, "/contact"),
      languages: alternateLanguages("/contact"),
    },
  };
}

/**
 * Contact.
 *
 * One tinted band holding two columns: who we are and when we answer on the
 * left, the form on the right. The split is the point — the left column is
 * what someone reads to decide whether to write at all, and it stays in
 * view beside the fields rather than being a footnote under them.
 *
 * It is a page of its own rather than the `#contact` band on the partners
 * page it replaced in the footer: that one is a call to action aimed at
 * carriers, and a customer whose move is already booked needs somewhere to
 * write that is not a pitch to join the network.
 */
export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const cx = dict.contactPage;

  /** Label over value, the way the left column reads. */
  const facts = [
    { label: cx.channelEmailTitle, value: SUPPORT_EMAIL, strong: true },
    { label: cx.channelHoursTitle, value: cx.channelHoursBody, strong: false },
    { label: cx.channelReplyTitle, value: cx.channelReplyBody, strong: false },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-20 pt-8 sm:pb-28 sm:pt-10">
        <Shell>
          {/* The band. Everything on this page lives inside it, which is
              what makes the two columns read as one object rather than as
              a heading that happens to sit above a form. */}
          <section className="relative overflow-hidden rounded-[1.75rem] border bg-brand-tint px-5 py-10 sm:px-10 sm:py-14 lg:px-14 dark:bg-card/40">
            <div
              className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[420px] opacity-60 glow-brand"
              aria-hidden
            />

            {/* The form gets the wider half: it is five fields and a
                textarea, and the column beside it is four short lines. */}
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14 3xl:gap-20">
              {/* ---------------------------------------------- left -- */}
              <div className="lg:sticky lg:top-24">
                <Eyebrow>{cx.eyebrow}</Eyebrow>

                <h1 className="mt-5 text-balance text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.05] tracking-[-0.04em]">
                  {cx.title}
                </h1>

                <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">
                  {cx.lede}
                </p>

                <dl className="mt-9 space-y-6 border-t pt-8">
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="eyebrow">{fact.label}</dt>
                      <dd
                        className={
                          fact.strong
                            ? "mt-1.5 break-all text-[16.5px] font-semibold tracking-[-0.02em]"
                            : "mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted-foreground"
                        }
                      >
                        {fact.strong ? (
                          <a
                            href={`mailto:${fact.value}`}
                            className="underline decoration-brand decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
                          >
                            {fact.value}
                          </a>
                        ) : (
                          fact.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-8 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
                  {cx.asideNote}
                </p>
              </div>

              {/* --------------------------------------------- right -- */}
              <ContactForm siteKey={turnstileSiteKey()} testKeys={usingTestKeys()} />
            </div>
          </section>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
