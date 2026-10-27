import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans } from "next/font/google";
import { AdminShell } from "@/components/admin/shell";
import { ThemeProvider } from "@/components/site/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminStoreProvider } from "@/lib/admin/store";
import { getDictionary } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/provider";
import "../globals.css";

/**
 * Admin root layout.
 *
 * A second root layout beside `[locale]`: the admin is an internal,
 * English-only tool, so it opts out of locale routing entirely (the proxy
 * skips `/admin`). It still wraps everything in the I18nProvider — with the
 * English dictionary — so shared components like the range calendar work
 * unchanged.
 */

const font = Instrument_Sans({
  variable: "--font-rotamove",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

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

export default function AdminLayout({ children }: { children: ReactNode }) {
  const dict = getDictionary("en");
  // Server-decided anchor; the client store receives it as a prop, so both
  // sides generate the identical seeded dataset.
  const anchorDate = new Date().toISOString().slice(0, 10);

  return (
    <html lang="en" suppressHydrationWarning className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider locale="en" dict={dict}>
            <TooltipProvider delayDuration={200}>
              <a
                href="#admin-main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
              >
                Skip to content
              </a>
              <AdminStoreProvider anchorDate={anchorDate}>
                <AdminShell>{children}</AdminShell>
              </AdminStoreProvider>
              <Toaster position="bottom-right" richColors closeButton />
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
