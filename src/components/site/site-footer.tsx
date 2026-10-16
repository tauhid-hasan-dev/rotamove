import Link from "next/link";
import { Logo } from "@/components/site/logo";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Move",
    links: [
      { label: "Start a search", href: "/" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Coverage", href: "/coverage" },
    ],
  },
  {
    title: "Movers",
    links: [
      { label: "Partner pricing", href: "/partners#plans" },
      { label: "Dashboard demo", href: "/partners/dashboard" },
      { label: "Partner FAQ", href: "/partners#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/how-it-works#about" },
      { label: "Trust & verification", href: "/how-it-works#trust" },
      { label: "Contact", href: "/partners#contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
              Verified movers across Türkiye, Europe, the Balkans, Scandinavia, the CIS, Central
              Asia and the Middle East.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
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
          <p>© {new Date().getFullYear()} Rotamove · Demo product</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="#" className="hover:text-foreground">
              KVKK &amp; GDPR
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
            <span>Istanbul · Berlin · Tashkent</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
