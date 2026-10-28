import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PartnerDashboard } from "@/components/partners/dashboard/dashboard";
import { generateLeadBoard } from "@/lib/demo-leads";
import { laneRepository } from "@/lib/lane-store";
import { unlockRepository } from "@/lib/unlock-store";
import { DEMO_PARTNER, PARTNER_COOKIE } from "@/lib/partner-session";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partners/dashboard">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.partnerDashboard.metaTitle,
    description: dict.partnerDashboard.metaDescription,
    robots: { index: false, follow: true },
  };
}

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
  // Server-rendered rather than fetched on mount: the lane board is the
  // partner's own data, so it should be on screen in the first paint.
  const lanes = await laneRepository.list(DEMO_PARTNER.id);
  // Pay-per-seen unlocks are billable server events; replaying them here is
  // what makes an unlocked lead stay unlocked across a refresh.
  const unlocks = await unlockRepository.listForPartner(DEMO_PARTNER.id);

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main">
        <PartnerDashboard
          board={board}
          now={now}
          lanes={lanes}
          initialUnlocked={unlocks.map((u) => u.leadId)}
        />
      </main>
      <SiteFooter />
    </>
  );
}
