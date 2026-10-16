import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PartnerDashboard } from "@/components/partners/dashboard/dashboard";
import { generateLeadBoard } from "@/lib/demo-leads";

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

export default async function PartnerDashboardPage() {
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
