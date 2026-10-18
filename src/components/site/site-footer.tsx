"use client";

import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { useI18n } from "@/i18n/provider";

export function SiteFooter() {
  const { dict, href } = useI18n();

  const columns = [
    {
      title: dict.footer.move,
      links: [
        { label: dict.common.startSearch, path: "/" },
        { label: dict.nav.howItWorks, path: "/how-it-works" },
        { label: dict.nav.coverage, path: "/coverage" },
      ],
    },
    {
      title: dict.footer.movers,
      links: [
        { label: dict.footer.partnerPricing, path: "/partners#plans" },
        { label: dict.footer.dashboardDemo, path: "/partners/dashboard" },
        { label: dict.footer.partnerFaq, path: "/partners#faq" },
      ],
    },
    {
      title: dict.footer.company,
      links: [
        { label: dict.footer.about, path: "/how-it-works#about" },
        { label: dict.footer.trust, path: "/how-it-works#trust" },
        { label: dict.footer.contact, path: "/partners#contact" },
      ],
    },
  ];

  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
              {dict.footer.blurb}
            </p>
            {/* A second, more discoverable switcher. Someone who scrolls to the
                bottom looking for the language picker is following a very old
                and very reliable convention. */}
            <div className="mt-6 inline-flex items-center rounded-full border bg-background">
              <LanguageSwitcher align="start" />
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={href(link.path)}
                        className="text-[14.5px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t pt-8 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {dict.footer.rights}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="#" className="hover:text-foreground">
              {dict.footer.privacy}
            </Link>
            <Link href="#" className="hover:text-foreground">
              {dict.footer.terms}
            </Link>
            <span>{dict.footer.offices}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
