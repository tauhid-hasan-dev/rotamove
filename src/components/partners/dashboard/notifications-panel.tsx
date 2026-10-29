"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Ban, CalendarClock, Check, FileWarning, Zap } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import type {
  PartnerNotification,
  PartnerNotificationKind,
} from "@/lib/partner-notifications";
import type { RequestableDocument } from "@/lib/partner-application";
import { cn } from "@/lib/utils";

/**
 * What the platform needs the partner to know.
 *
 * The other half of every decision the vetting team makes: the reviewer
 * performs one action and it lands both in the applicant's inbox and here. A
 * document request that only went out by email is invisible to a partner who
 * signs in to find out what is holding their application up.
 *
 * Rendered from a kind plus parameters rather than from a stored sentence, so
 * a request raised while the reviewer was working in English still reads in
 * Turkish to the partner who receives it. The one exception is `note` — the
 * reviewer's own words, shown verbatim, because translating a human's
 * sentence is not ours to do.
 *
 * Fetched on mount rather than server-rendered. It is the one part of this
 * page that can change while the partner is looking at it — a reviewer two
 * desks away might be approving them right now — and the dashboard is
 * otherwise rendered once per request.
 */

const ICONS: Record<PartnerNotificationKind, typeof FileWarning> = {
  documents_requested: FileWarning,
  application_approved: BadgeCheck,
  application_declined: Ban,
  plan_queued: CalendarClock,
  plan_activated: Zap,
};

/** Only one of these is an instruction the partner has to act on. */
const URGENT: ReadonlySet<PartnerNotificationKind> = new Set(["documents_requested"]);

export function NotificationsPanel() {
  const { dict, t } = useI18n();
  const nx = dict.partnerDashboard.notifications;

  const [items, setItems] = useState<PartnerNotification[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/partners/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { notifications: PartnerNotification[] };
      setItems(data.notifications.filter((n) => !n.readAt));
    } catch {
      // A failed fetch leaves the panel absent rather than showing an error
      // box. This is an additive notice, not the content of the page, and a
      // red failure strip above a working dashboard is worse than silence.
    }
  }, []);

  useEffect(() => {
    // Through a zero-delay timer, so the state update happens in a callback
    // rather than in the effect body — the shape `react-hooks/
    // set-state-in-effect` insists on.
    const initial = setTimeout(() => void load(), 0);
    return () => clearTimeout(initial);
  }, [load]);

  const dismiss = async (id: string) => {
    // Optimistic: the row goes immediately and the request follows. Nothing
    // is lost if it fails — the notification simply reappears on the next
    // load, which is the correct outcome for something unread.
    setItems((all) => all.filter((n) => n.id !== id));
    try {
      await fetch("/api/partners/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      /* see above */
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-5" aria-label={nx.heading}>
      <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {nx.heading}
      </h3>

      <ul className="mt-3 space-y-2.5">
        {items.map((n) => {
          const Icon = ICONS[n.kind];
          const urgent = URGENT.has(n.kind);
          return (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 shadow-soft",
                // Amber for the one that is an instruction, the brand tint
                // for everything that is merely news. A document request
                // that looked like a plan confirmation would be read as one.
                urgent
                  ? "border-lastcall-accent/40 bg-lastcall text-lastcall-foreground"
                  : "border-brand/20 bg-brand-tint dark:border-border dark:bg-card",
              )}
            >
              <Icon
                className={cn("mt-0.5 size-4 shrink-0", !urgent && "text-brand")}
                aria-hidden
              />

              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{nx.kinds[n.kind]}</p>

                {n.kind === "plan_queued" && n.toPlan && n.effectiveFrom && (
                  <p className="mt-1 text-[13px] leading-relaxed opacity-90">
                    {t.fill(dict.partnerDashboard.planChange.pendingLine, {
                      plan: dict.partnerDashboard.planNames[
                        n.toPlan as keyof typeof dict.partnerDashboard.planNames
                      ],
                      date: t.dateLong(n.effectiveFrom),
                    })}
                  </p>
                )}

                {n.kind === "plan_activated" && n.toPlan && (
                  <p className="mt-1 text-[13px] leading-relaxed opacity-90">
                    {t.fill(nx.nowOn, {
                      plan: dict.partnerDashboard.planNames[
                        n.toPlan as keyof typeof dict.partnerDashboard.planNames
                      ],
                    })}
                  </p>
                )}

                {n.documents && n.documents.length > 0 && (
                  <>
                    <p className="mt-2 text-[13px] font-medium">{nx.documentsIntro}</p>
                    <ul className="mt-1 space-y-0.5">
                      {n.documents.map((doc) => (
                        <li key={doc} className="text-[13px] leading-relaxed opacity-90">
                          {/* Labels live in the admin block because that is
                              where they were first needed. One list, read
                              by both sides — the reviewer's wording and the
                              partner's have to be the same words. */}
                          ·{" "}
                          {dict.admin.pending.documents[doc as RequestableDocument] ?? doc}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {n.note && (
                  <p className="mt-2 text-[13px] leading-relaxed opacity-90">
                    <span className="font-medium">{nx.noteIntro}</span> {n.note}
                  </p>
                )}

                <p className="mt-2 text-[11.5px] opacity-70 tnum">
                  {t.dateLong(n.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void dismiss(n.id)}
                title={nx.markRead}
                aria-label={nx.markRead}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-foreground/10"
              >
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
