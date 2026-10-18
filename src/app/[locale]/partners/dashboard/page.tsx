import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PartnerDashboard } from "@/components/partners/dashboard/dashboard";
import { generateLeadBoard } from "@/lib/demo-leads";
import { PARTNER_COOKIE } from "@/lib/partner-session";
import { resolveLocale } from "@/i18n/dictionaries";
import { localePath } from "@/i18n/paths";

export const metadata: Metadata = {
  title: "Partner dashboard demo",
  description:
    "See how the Rotamove lead board works on both plans — Pro Unlimited at $100 a month, or pay per lead capped at $7.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

/**
 * Resolved outside the component body: the clock is read once per request and
 * threaded through as data, so every relative timestamp renders identically on
 * the server and the client.
 */
async function loadBoard() {
  const now = Date.now();
  return { now, board: generateLeadBoard(now, 18) };
}

export default async function PartnerDashboardPage({
  params,
}: PageProps<"/[locale]/partners/dashboard">) {
  const locale = resolveLocale((await params).locale);

  // Checked on the server before anything renders, so the board never flashes
  // to a signed-out visitor.
  const signedIn = (await cookies()).get(PARTNER_COOKIE)?.value === "1";
  if (!signedIn) redirect(localePath(locale, "/partners/login"));

  const { now, board } = await loadBoard();

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main">
        <PartnerDashboard board={board} now={now} />
      </main>
      <SiteFooter />
    </>
  );
}
