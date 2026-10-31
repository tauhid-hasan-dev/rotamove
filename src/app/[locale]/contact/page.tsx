import type { Metadata } from "next";
import { Clock3, Mail, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
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
 * Deliberately a page of its own rather than the `#contact` band on the
 * partners page it replaces in the footer: that one is a call to action
 * aimed at carriers, and a customer whose move is already booked needs
 * somewhere to write that is not a pitch to join the network.
 *
 * The site key is read here, on the server, and handed down. It is public
 * by design — the secret never leaves `lib/turnstile.ts` — but reading it
 * in one place keeps the env var out of three client components.
 */
export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const cx = dict.contactPage;

  const channels = [
    { icon: Mail, title: cx.channelEmailTitle, body: SUPPORT_EMAIL },
    { icon: Clock3, title: cx.channelHoursTitle, body: cx.channelHoursBody },
    { icon: MessageSquare, title: cx.channelReplyTitle, body: cx.channelReplyBody },
  ];

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="relative pb-14 pt-14 sm:pt-20">
          <div
            className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[460px] opacity-75 glow-brand"
            aria-hidden
          />
          <Shell>
            <p className="eyebrow">{cx.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-balance text-[clamp(2rem,4.2vw,3rem)] leading-[1.04] tracking-[-0.04em]">
              {cx.title}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              {cx.lede}
            </p>
          </Shell>
        </section>

        <section className="pb-24 sm:pb-32">
          <Shell>
            {/* The form is the page; the three facts beside it are the
                things someone checks before deciding to write at all —
                where it goes, when it is read, how long a reply takes. */}
            {/* `grid-cols-1` declared, not implicit. An implicit track is
                sized to its content's minimum, and the Turnstile widget is a
                fixed 300px iframe — the column grew to fit it and took the
                whole page off the side of a 320px phone. */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 3xl:grid-cols-[minmax(0,1fr)_380px]">
              <ContactForm siteKey={turnstileSiteKey()} testKeys={usingTestKeys()} />

              <aside className="space-y-4 lg:pt-2">
                {channels.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="rounded-2xl border bg-card p-5">
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4 text-brand" aria-hidden />
                      <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {title}
                      </h2>
                    </div>
                    <p className="mt-2.5 text-[14.5px] leading-relaxed">{body}</p>
                  </div>
                ))}

                <p className="px-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {cx.asideNote}
                </p>
              </aside>
            </div>
          </Shell>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
