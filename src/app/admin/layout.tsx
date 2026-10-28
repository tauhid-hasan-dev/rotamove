import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { IBM_Plex_Sans_Arabic, Instrument_Sans, Inter } from "next/font/google";
import { AdminShell } from "@/components/admin/shell";
import { ThemeProvider } from "@/components/site/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminStoreProvider } from "@/lib/admin/store";
import { getDictionary } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import { LOCALE_COOKIE, SCRIPT_FOR_LOCALE, dirFor, isLocale, type Locale } from "@/i18n/config";
import "../globals.css";

/**
 * Admin root layout.
 *
 * A second root layout beside `[locale]`: the admin keeps its unprefixed
 * `/admin` URLs (the proxy skips it), but it is no longer English-only — the
 * locale comes from the same `rotamove.locale` cookie the public site's
 * switcher writes, so changing language anywhere changes it everywhere. The
 * topbar has its own switcher that writes the cookie and refreshes.
 */

/** Same three script-matched families as the public layout. */
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

export const metadata: Metadata = {
  title: {
    default: "Rotamove Admin",
    template: "%s · Rotamove Admin",
  },
  description: "Internal operations console for the Rotamove lead marketplace.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f120e" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** The dataset anchors on "today", so the page must render per-request. */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookie) ? cookie : "en";
  const dict = getDictionary(locale);
  const dir = dirFor(locale);
  const font = FONT_FOR_SCRIPT[SCRIPT_FOR_LOCALE[locale]];
  // Server-decided anchor; the client store receives it as a prop, so both
  // sides generate the identical seeded dataset.
  const anchorDate = new Date().toISOString().slice(0, 10);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${font.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider locale={locale} dict={dict}>
            <TooltipProvider delayDuration={200}>
              <a
                href="#admin-main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
              >
                {dict.common.skipToContent}
              </a>
              <AdminStoreProvider anchorDate={anchorDate}>
                <AdminShell>{children}</AdminShell>
              </AdminStoreProvider>
              <Toaster
                position={dir === "rtl" ? "bottom-left" : "bottom-right"}
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
