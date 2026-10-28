import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic, Instrument_Sans, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { LastCallBar } from "@/components/site/last-call-bar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LAST_CALL_SCRIPT } from "@/lib/last-call";
import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";
import {
  LOCALES,
  LOCALE_META,
  SCRIPT_FOR_LOCALE,
  dirFor,
  isLocale,
  type Locale,
} from "@/i18n/config";
import "../globals.css";

/**
 * Root layout — one per locale.
 *
 * `<html>` lives here rather than in `app/layout.tsx` because `lang` and `dir`
 * are locale-dependent, and this is the deepest layout that knows the locale
 * without going dynamic. All eight locales are prerendered.
 */

/**
 * Three typefaces, but never more than one per visitor.
 *
 * Instrument Sans ships `latin` + `latin-ext` only — no Cyrillic, no Arabic.
 * Left alone, Russian and Arabic would fall back to whatever the OS supplies
 * and look broken, so each script gets a family that actually covers it. All
 * three expose the *same* CSS variable, and only the active locale's class is
 * applied, so a Dutch visitor downloads no Arabic glyphs and vice versa.
 */
const latin = Instrument_Sans({
  variable: "--font-rotamove",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const cyrillic = Inter({
  variable: "--font-rotamove",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-rotamove",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const FONT_FOR_SCRIPT = { latin, cyrillic, arabic } as const;

const SITE_URL = "https://rotamove.demo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.titleDefault,
      template: dict.meta.titleTemplate,
    },
    description: dict.meta.description,
    keywords: [...dict.meta.keywords],
    // Tells search engines that these eight URLs are the same page in
    // different languages, rather than eight competing pages.
    alternates: {
      canonical: localePath(locale, "/"),
      languages: alternateLanguages("/"),
    },
    openGraph: {
      type: "website",
      url: localePath(locale, "/"),
      siteName: "Rotamove",
      locale: LOCALE_META[locale].bcp47.replace("-", "_"),
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f120e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // The proxy only ever prefixes a known locale, so anything else here was
  // typed or linked by hand — a 404 is more honest than silent English.
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const font = FONT_FOR_SCRIPT[SCRIPT_FOR_LOCALE[locale as Locale]];

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      suppressHydrationWarning
      // globals.css sets `scroll-behavior: smooth`; this tells the router to
      // opt out of it during route transitions rather than animating every
      // navigation's scroll reset.
      data-scroll-behavior="smooth"
      className={`${font.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {/* Applies the dismissal before anything paints — see lib/last-call.ts. */}
        <script dangerouslySetInnerHTML={{ __html: LAST_CALL_SCRIPT }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider locale={locale} dict={dict}>
            <TooltipProvider delayDuration={200}>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
              >
                {dict.common.skipToContent}
              </a>
              <LastCallBar />
              {children}
              <Toaster
                position={dirFor(locale) === "rtl" ? "bottom-left" : "bottom-right"}
                richColors
                closeButton
              />
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
