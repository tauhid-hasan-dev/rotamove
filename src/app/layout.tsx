import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/site/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/**
 * One typeface, used everywhere. Instrument Sans is quiet at body size and
 * gets genuinely elegant when set large and tight — which is all a travel
 * product needs. A second family would be decoration, not information.
 */
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const SITE_URL = "https://rotamove.demo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rotamove — find movers across Türkiye, Europe & Central Asia",
    template: "%s · Rotamove",
  },
  description:
    "One search. Verified movers for Türkiye, Europe, the Balkans, Scandinavia, the CIS, Central Asia and the Middle East.",
  keywords: [
    "international movers",
    "Turkey to Europe moving",
    "uluslararası nakliyat",
    "relocation quotes",
    "Central Asia relocation",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Rotamove",
    title: "Compare verified movers across 53 countries",
    description:
      "Tell us where you're moving. We match you with verified movers who come to you.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-ink"
            >
              Skip to content
            </a>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
