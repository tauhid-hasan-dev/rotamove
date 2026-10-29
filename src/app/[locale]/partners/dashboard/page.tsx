import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PartnerDashboard } from "@/components/partners/dashboard/dashboard";
import { generateLeadBoard } from "@/lib/demo-leads";
import { laneRepository } from "@/lib/lane-store";
import { unlockRepository } from "@/lib/unlock-store";
import { planRepository } from "@/lib/plan-store";
import { partnerProfileRepository, seedProfile } from "@/lib/partner-profile";
import { accountForCookie, PARTNER_COOKIE } from "@/lib/partner-session";
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
  // to a signed-out visitor. Which account, not merely whether — the three
  // demo logins are on different plans.
  const account = accountForCookie((await cookies()).get(PARTNER_COOKIE)?.value);
  if (!account) redirect(localePath(locale, "/partners/login"));

  const { now, board } = await loadBoard();
  // Server-rendered rather than fetched on mount: the lane board is the
  // partner's own data, so it should be on screen in the first paint.
  const lanes = await laneRepository.list(account.mover.id);
  // Pay-per-seen unlocks are billable server events; replaying them here is
  // what makes an unlocked lead stay unlocked across a refresh.
  const unlocks = await unlockRepository.listForPartner(account.mover.id);
  // Reading this is also what promotes a queued plan change whose start date
  // has passed — the sweep a scheduled job would do in a deployed system.
  const subscription = planRepository.get(account.mover.id, account.plan, now);
  // Seeded from the mover record on first read, so Settings opens on a filled
  // form rather than on empty required fields.
  const profile = partnerProfileRepository.get(
    account.mover.id,
    seedProfile({
      partnerId: account.mover.id,
      mover: account.mover,
      email: account.email,
      locale,
    }),
  );

  // No SiteHeader and no SiteFooter. This is a signed-in workspace, not a
  // page of the marketing site: the public nav offered a partner mid-task
  // eight ways to leave it, and the dashboard carries its own bar.
  return (
    <main id="main">
      <PartnerDashboard
        board={board}
        now={now}
        lanes={lanes}
        initialUnlocked={unlocks.map((u) => u.leadId)}
        subscription={subscription}
        profile={profile}
        account={{
          name: account.mover.name,
          email: account.email,
          partnerId: account.partnerId,
          moverId: account.mover.id,
        }}
      />
    </main>
  );
}
