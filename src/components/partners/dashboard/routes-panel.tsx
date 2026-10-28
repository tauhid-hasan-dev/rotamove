"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarRange,
  Box,
  Clock3,
  Pause,
  Pencil,
  Play,
  Plane,
  Plus,
  Repeat,
  Route,
  Ship,
  Train,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { LaneDialog } from "@/components/partners/dashboard/lane-dialog";
import {
  laneExpired,
  lastCallEndAt,
  lastCallHoursLeft,
  type LaneInput,
  type PartnerLane,
} from "@/lib/lanes";
import { getCity } from "@/lib/geo";
import { todayLocalIso } from "@/lib/calendar";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const MODE_ICONS = { road: Truck, sea: Ship, air: Plane, rail: Train } as const;

/**
 * The partner's lane board.
 *
 * This is the half of the product a carrier actually maintains. Region
 * coverage was set once at onboarding and is nearly static; lanes change
 * weekly, because a lane *is* a vehicle — and the dated ones are the whole
 * reason the screen exists: a lorry delivering a job somewhere new has space
 * on it, and until the carrier can say so, nobody can be matched to it.
 *
 * Every write goes through the API and the response replaces local state, so
 * what is on screen is what the matching engine will read on the next search.
 * No optimistic update: a lane that looks saved but is not would send the
 * carrier to a border with no load.
 */
export function RoutesPanel({ initial, now }: { initial: PartnerLane[]; now: number }) {
  const { dict, t } = useI18n();
  const lx = dict.partnerDashboard.lanes;
  const [lanes, setLanes] = useState(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerLane | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const today = todayLocalIso();
  const active = lanes.filter(
    (lane) => lane.status === "active" && !laneExpired(lane, today, now),
  );
  const dated = active.filter((lane) => lane.window).length;

  const capacity = active.reduce((sum, lane) => sum + lane.capacityM3, 0);

  const replace = (lane: PartnerLane) =>
    setLanes((prev) => {
      const index = prev.findIndex((item) => item.id === lane.id);
      if (index === -1) return [lane, ...prev];
      const next = [...prev];
      next[index] = lane;
      return next;
    });

  const submit = async (input: LaneInput): Promise<boolean> => {
    const editingId = editing?.id;
    try {
      const response = await fetch(
        editingId ? `/api/partners/lanes/${editingId}` : "/api/partners/lanes",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string; issues?: Array<{ message: string }> }
          | null;
        toast.error(data?.issues?.[0]?.message ?? data?.error ?? lx.saveFailed);
        return false;
      }
      const { lane } = (await response.json()) as { lane: PartnerLane };
      replace(lane);
      toast.success(editingId ? lx.updated : lx.added, {
        description: lane.window
          ? t.fill(lx.matchingFrom, { range: t.dateRange(lane.window) })
          : lx.matchingNow,
      });
      return true;
    } catch {
      toast.error(lx.serverUnreachable);
      return false;
    }
  };

  const toggleStatus = async (lane: PartnerLane) => {
    setBusyId(lane.id);
    const status = lane.status === "active" ? "paused" : "active";
    try {
      const response = await fetch(`/api/partners/lanes/${lane.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      const { lane: updated } = (await response.json()) as { lane: PartnerLane };
      replace(updated);
      toast.success(status === "paused" ? lx.pausedToast : lx.liveToast, {
        description: status === "paused" ? lx.pausedBody : lx.liveBody,
      });
    } catch {
      toast.error(lx.updateFailed);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (lane: PartnerLane) => {
    setBusyId(lane.id);
    try {
      const response = await fetch(`/api/partners/lanes/${lane.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setLanes((prev) => prev.filter((item) => item.id !== lane.id));
      toast.success(lx.removed);
    } catch {
      toast.error(lx.removeFailed);
    } finally {
      setBusyId(null);
    }
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (lane: PartnerLane) => {
    setEditing(lane);
    setDialogOpen(true);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] tracking-[-0.03em]">{lx.title}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground tnum">
            {t.fill(lx.liveCount, { n: active.length })}
            {dated > 0 && ` · ${t.fill(lx.datedCount, { n: dated })}`} ·{" "}
            {t.fill(lx.capacityDeclared, { n: t.number(capacity) })}
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="ms-auto inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985]"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          {lx.add}
        </button>
      </div>

      {/* The one thing a carrier needs to believe for this screen to be worth
          their time. Said once, at the top, rather than in a help article. */}
      <p className="mt-4 rounded-xl border border-dashed bg-surface/60 p-3.5 text-[13px] leading-relaxed text-muted-foreground">
        {lx.intro}
      </p>

      <div className="mt-5 space-y-3">
        <AnimatePresence initial={false}>
          {lanes.map((lane) => (
            <LaneCard
              key={lane.id}
              lane={lane}
              now={now}
              busy={busyId === lane.id}
              expired={laneExpired(lane, today, now)}
              onEdit={() => openEdit(lane)}
              onToggle={() => void toggleStatus(lane)}
              onRemove={() => void remove(lane)}
            />
          ))}
        </AnimatePresence>

        {lanes.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Route className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-[14.5px] font-medium">{lx.emptyTitle}</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
              {lx.emptyBody}
            </p>
            <button
              type="button"
              onClick={openNew}
              className="mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] transition-colors hover:bg-muted"
            >
              <Plus className="size-4" />
              {lx.addFirst}
            </button>
          </div>
        )}
      </div>

      <LaneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={submit}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */

function LaneCard({
  lane,
  now,
  busy,
  expired,
  onEdit,
  onToggle,
  onRemove,
}: {
  lane: PartnerLane;
  now: number;
  busy: boolean;
  expired: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { dict, t } = useI18n();
  const lx = dict.partnerDashboard.lanes;
  // Removing a lane is not recoverable, and the button sits next to Edit.
  // One deliberate second click costs a moment; a mis-click costs a run.
  const [confirming, setConfirming] = useState(false);
  const from = getCity(lane.fromCode);
  const to = getCity(lane.toCode);
  const ModeIcon = MODE_ICONS[lane.mode];
  const paused = lane.status !== "active";
  const dormant = paused || expired;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "overflow-hidden rounded-xl border bg-card p-4 transition-shadow duration-300 hover:shadow-soft",
        dormant && "bg-muted/30",
        busy && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {lane.lastCall ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lastcall-accent px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink">
                <Clock3 className="size-3" />
                {lx.lastCall}
                <span className="tnum opacity-80">
                  · {t.fill(lx.lastCallHours, { n: lane.lastCall.hours })}
                </span>
              </span>
            ) : lane.window ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink">
                <CalendarRange className="size-3" />
                {lx.oneRun}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                <Repeat className="size-3" />
                {lx.scheduled}
              </span>
            )}
            {paused && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                {lx.paused}
              </span>
            )}
            {expired && !paused && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                {lx.finished}
              </span>
            )}
          </div>

          {/* The route, in the hub codes a dispatcher reads fastest. */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="code text-[14px]">{lane.fromCode}</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="h-px w-5 dotted-route" />
              <ModeIcon className="size-3.5" />
              <span className="h-px w-5 dotted-route" />
            </span>
            <span className="code text-[14px]">{lane.toCode}</span>
            {lane.bothWays && (
              <span className="rounded-full border px-2 py-0.5 text-[10.5px] text-muted-foreground">
                {lx.bothWays}
              </span>
            )}
          </div>

          <p className="mt-1.5 truncate text-[13px] text-muted-foreground">
            {from?.name ?? lane.fromCode} → {to?.name ?? lane.toCode}
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] text-muted-foreground tnum">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="size-3.5" />
              {lane.vehicle === "lorry" ? lx.lorry : lx.minivan}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Box className="size-3.5" />
              {t.fill(lx.capacityFree, { n: t.number(lane.capacityM3) })}
            </span>
            {lane.window && !lane.lastCall ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarRange className="size-3.5" />
                {t.dateRange(lane.window)}
              </span>
            ) : null}
          </dl>

          {/*
            A last-call run is a promise with a deadline, so the card states
            all three parts of it: when the vehicle leaves, when the offer
            dies, and how long that leaves. The end is never typed — it is
            the start plus the duration — so showing it back is the only way
            the partner can check what they actually committed to.
          */}
          {lane.lastCall && (
            <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg bg-lastcall/60 px-3 py-2 text-[11.5px] tnum">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">{lx.lastCallStarts}</dt>
                <dd className="font-medium">{t.dateTime(lane.lastCall.startAt)}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-muted-foreground">{lx.lastCallEnds}</dt>
                <dd className="font-medium">{t.dateTime(lastCallEndAt(lane.lastCall))}</dd>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  expired ? "text-muted-foreground" : "text-lastcall-foreground",
                )}
              >
                <Clock3 className="size-3.5" />
                {expired
                  ? lx.lastCallExpired
                  : t.fill(lx.lastCallLeft, { n: lastCallHoursLeft(lane, now) })}
              </span>
            </dl>
          )}

          {lane.notes && (
            <p className="mt-3 border-s-2 border-border ps-3 text-[12.5px] italic leading-relaxed text-muted-foreground">
              {lane.notes}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconAction label={lx.edit} onClick={onEdit} disabled={busy}>
            <Pencil className="size-3.5" />
          </IconAction>
          <IconAction
            label={paused ? lx.resume : lx.pause}
            onClick={onToggle}
            disabled={busy}
          >
            {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          </IconAction>
          <IconAction
            label={lx.remove}
            onClick={() => setConfirming(true)}
            disabled={busy || confirming}
            destructive
          >
            <Trash2 className="size-3.5" />
          </IconAction>
        </div>
      </div>

      {confirming && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-3">
          <p className="me-auto text-[12.5px] text-muted-foreground">
            {lx.confirmRemove}
          </p>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full px-3 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {lx.keep}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onRemove();
            }}
            className="rounded-full bg-destructive px-4 py-1.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {lx.removeConfirm}
          </button>
        </div>
      )}
    </motion.article>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        destructive && "hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      {children}
    </button>
  );
}
