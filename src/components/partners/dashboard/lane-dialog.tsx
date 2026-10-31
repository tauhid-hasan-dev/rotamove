"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  CalendarRange,
  Clock3,
  Loader2,
  Plane,
  Repeat,
  Ship,
  Train,
  Truck,
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RangeCalendar } from "@/components/common/range-calendar";
import { HubPicker } from "@/components/partners/dashboard/hub-picker";
import {
  laneInputSchema,
  lastCallEndAt,
  lastCallWindow,
  LANE_MODES,
  LANE_VEHICLES,
  LAST_CALL_HOURS,
  type LaneInput,
  type LastCallHours,
  type PartnerLane,
} from "@/lib/lanes";
import { daysBetween, todayLocalIso } from "@/lib/calendar";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const MODE_ICONS = { road: Truck, sea: Ship, air: Plane, rail: Train } as const;

/** What kind of run is being declared. Drives everything else on the form. */
type LaneKind = "scheduled" | "one_run" | "last_call";

/** Local `yyyy-mm-ddThh:mm` → ISO with the browser's offset. */
function localToIso(date: string, hour: string): string | null {
  const parsed = new Date(`${date}T${hour}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * The form's own state.
 *
 * Three fields deliberately do not match the stored lane:
 *
 *  - hubs start `null`, because "not chosen" is not a hub;
 *  - capacity is a string, because an empty number input is not zero, and
 *    coercing it early is how a form ends up claiming a lorry with no space;
 *  - the date range is held half-open, as `{start, end}` with either side
 *    `null`. A range picker has to be able to say "start chosen, waiting for
 *    the end"; collapsing that to `[start, start]` makes the second click
 *    look like the start of a new range, and the user can never close one.
 *
 * `kind` is its own field rather than being inferred from the range, so
 * switching to a scheduled service and back does not lose the dates — and so
 * a last-call run stays distinguishable from an ordinary dated one even
 * though both end up carrying a window.
 */
type Draft = Omit<LaneInput, "fromCode" | "toCode" | "capacityM3" | "window" | "lastCall"> & {
  fromCode: string | null;
  toCode: string | null;
  capacityM3: string;
  kind: LaneKind;
  range: { start: string | null; end: string | null };
  /** Last call only: departure day, departure hour, and how long it runs. */
  lastCallDate: string | null;
  lastCallHour: string;
  lastCallHours: LastCallHours;
};

/** A blank lane. Road and a lorry, because that is the overwhelming default. */
const emptyDraft = (): Draft => ({
  fromCode: null,
  toCode: null,
  bothWays: false,
  kind: "scheduled",
  range: { start: null, end: null },
  lastCallDate: null,
  lastCallHour: "09:00",
  lastCallHours: 24,
  vehicle: "lorry",
  mode: "road",
  capacityM3: "",
  notes: "",
  status: "active",
});

const draftFrom = (lane: PartnerLane): Draft => {
  const start = lane.lastCall ? new Date(lane.lastCall.startAt) : null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    fromCode: lane.fromCode,
    toCode: lane.toCode,
    bothWays: lane.bothWays,
    kind: lane.lastCall ? "last_call" : lane.window !== null ? "one_run" : "scheduled",
    range: lane.window
      ? { start: lane.window[0], end: lane.window[1] }
      : { start: null, end: null },
    lastCallDate: start
      ? `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
      : null,
    lastCallHour: start ? `${pad(start.getHours())}:${pad(start.getMinutes())}` : "09:00",
    lastCallHours: lane.lastCall?.hours ?? 24,
    vehicle: lane.vehicle,
    mode: lane.mode,
    capacityM3: String(lane.capacityM3),
    notes: lane.notes,
    status: lane.status,
  };
};

/**
 * Declare or change one lane.
 *
 * The decision the form is built around is the first one: is this the
 * timetable, or is it one vehicle going somewhere once? Everything else
 * follows from that, so it is the control at the top and the only one that
 * changes what else is on screen.
 */
export function LaneDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The lane being changed, or `null` to declare a new one. */
  editing: PartnerLane | null;
  onSubmit: (input: LaneInput) => Promise<boolean>;
}) {
  const { dict, t } = useI18n();
  const dx = dict.partnerDashboard.laneDialog;
  const [draft, setDraft] = useState<Draft>(() =>
    editing ? draftFrom(editing) : emptyDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reload the form when the dialog is pointed at a different lane. Done
  // during render rather than in an effect: no second commit, and no frame
  // where the previous lane's values are on screen.
  // Keyed on the open state as well, so declaring two lanes in a row starts
  // from a blank form the second time rather than the one just submitted.
  const [key, setKey] = useState(() => `${editing?.id ?? "new"}:${open}`);
  const wanted = `${editing?.id ?? "new"}:${open}`;
  if (key !== wanted) {
    setKey(wanted);
    setDraft(editing ? draftFrom(editing) : emptyDraft());
    setError(null);
  }

  const update = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const { kind, range } = draft;
  const dated = kind === "one_run";
  const isLastCall = kind === "last_call";
  const span = range.start && range.end ? daysBetween(range.start, range.end) + 1 : 0;

  // The end is never typed — it is the start plus the chosen duration, shown
  // live so the partner can see exactly when the offer dies before saving.
  const lastCallStartIso =
    draft.lastCallDate && localToIso(draft.lastCallDate, draft.lastCallHour);
  const lastCallEndIso = lastCallStartIso
    ? lastCallEndAt({ startAt: lastCallStartIso, hours: draft.lastCallHours })
    : null;

  const save = async () => {
    // Checked before the schema so the message names the thing that is
    // missing. Zod's own "expected string, received null" is true and useless.
    if (!draft.fromCode || !draft.toCode) {
      setError(dx.errBothEnds);
      return;
    }
    if (!draft.capacityM3 || Number(draft.capacityM3) < 1) {
      setError(dx.errCapacity);
      return;
    }
    if (dated && !range.start) {
      setError(dx.errDates);
      return;
    }
    if (isLastCall && !lastCallStartIso) {
      setError(dx.errLastCallStart);
      return;
    }

    const lastCall =
      isLastCall && lastCallStartIso
        ? { hours: draft.lastCallHours, startAt: lastCallStartIso }
        : null;

    // A run with only a start is a single-day departure, which is a real
    // thing to declare — so it saves rather than nagging for a second click.
    const window = lastCall
      ? lastCallWindow(lastCall)
      : dated && range.start
        ? [range.start, range.end ?? range.start]
        : null;

    const parsed = laneInputSchema.safeParse({
      ...draft,
      capacityM3: Number(draft.capacityM3),
      window,
      lastCall,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? dx.errCheck);
      return;
    }
    setSaving(true);
    const ok = await onSubmit(parsed.data);
    setSaving(false);
    if (ok) onOpenChange(false);
    else setError(dx.errSave);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto scrollbar-slim sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] tracking-[-0.03em]">
            {editing ? dx.editTitle : dx.addTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-6">
          {/* kind ------------------------------------------------- */}
          <div className="grid gap-3 sm:grid-cols-3">
            <KindCard
              selected={kind === "scheduled"}
              onSelect={() => update({ kind: "scheduled" })}
              icon={<Repeat className="size-4" />}
              title={dx.scheduledTitle}
              hint={dx.scheduledHint}
            />
            <KindCard
              selected={dated}
              // Nothing is pre-filled. Seeding the start with today looks
              // helpful and is not: the calendar would then read the user's
              // first click as the *end* of a range beginning today.
              onSelect={() => update({ kind: "one_run" })}
              icon={<CalendarRange className="size-4" />}
              title={dx.oneRunTitle}
              hint={dx.oneRunHint}
            />
            <KindCard
              selected={isLastCall}
              onSelect={() =>
                update({
                  kind: "last_call",
                  // Unlike the range picker, a departure day *is* safe to
                  // seed: there is one date field, so today is a sane start
                  // rather than half of an ambiguous range.
                  lastCallDate: draft.lastCallDate ?? todayLocalIso(),
                })
              }
              icon={<Clock3 className="size-4" />}
              title={dx.lastCallTitle}
              hint={dx.lastCallHint}
            />
          </div>

          {/* route ------------------------------------------------ */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <HubPicker
              label={dx.from}
              value={draft.fromCode}
              onChange={(code) => update({ fromCode: code })}
              exclude={draft.toCode}
            />
            <button
              type="button"
              onClick={() => update({ fromCode: draft.toCode, toCode: draft.fromCode })}
              aria-label={dx.swap}
              className="mb-0.5 hidden size-11 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground sm:grid"
            >
              <ArrowLeftRight className="size-4" />
            </button>
            <HubPicker
              label={dx.to}
              value={draft.toCode}
              onChange={(code) => update({ toCode: code })}
              exclude={draft.fromCode}
            />
          </div>

          <SwitchRow
            checked={draft.bothWays}
            onChange={(bothWays) => update({ bothWays })}
            title={dx.bothWaysTitle}
            hint={dx.bothWaysHint}
          />

          {/* dates ------------------------------------------------ */}
          {dated && (
            <div className="rounded-2xl border bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[13.5px] font-medium">{dx.whenRuns}</span>
                <span className="text-[12.5px] text-muted-foreground tnum">
                  {span > 1
                    ? t.fill(dx.daysCount, { n: span })
                    : range.start
                      ? dx.pickLast
                      : dx.pickFirst}
                </span>
              </div>
              <div className="mt-3">
                <RangeCalendar months={1} value={range} onChange={(next) => update({ range: next })} />
              </div>
            </div>
          )}

          {/* last call -------------------------------------------- */}
          {isLastCall && (
            <div className="rounded-2xl border bg-surface p-4">
              <span className="text-[13.5px] font-medium">{dx.lastCallDuration}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {LAST_CALL_HOURS.map((hours) => (
                  <Chip
                    key={hours}
                    active={draft.lastCallHours === hours}
                    onClick={() => update({ lastCallHours: hours })}
                  >
                    {t.fill(dx.lastCallHoursOption, { n: hours })}
                  </Chip>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="lc-date" className="mb-2 block text-[13.5px]">
                    {dx.lastCallStartDate}
                  </label>
                  <Input
                    id="lc-date"
                    type="date"
                    min={todayLocalIso()}
                    value={draft.lastCallDate ?? ""}
                    onChange={(event) => update({ lastCallDate: event.target.value || null })}
                    className="h-12 rounded-2xl tnum"
                  />
                </div>
                <div>
                  <label htmlFor="lc-hour" className="mb-2 block text-[13.5px]">
                    {dx.lastCallStartHour}
                  </label>
                  <Input
                    id="lc-hour"
                    type="time"
                    step={900}
                    value={draft.lastCallHour}
                    onChange={(event) => update({ lastCallHour: event.target.value })}
                    className="h-12 rounded-2xl tnum"
                  />
                </div>
              </div>

              {/* The whole point of the mode: the partner sees the deadline
                  they are committing to before they commit to it. */}
              <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1.5 border-t pt-3.5 text-[12.5px]">
                <div className="flex items-baseline gap-2">
                  <dt className="text-muted-foreground">{dx.lastCallStarts}</dt>
                  <dd className="tnum font-medium">
                    {lastCallStartIso ? t.dateTime(lastCallStartIso) : "—"}
                  </dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="text-muted-foreground">{dx.lastCallEnds}</dt>
                  <dd className="tnum font-medium text-brand-deep">
                    {lastCallEndIso ? t.dateTime(lastCallEndIso) : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* vehicle and capacity -------------------------------- */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-[13.5px]">{dx.vehicle}</span>
              {/* Driven off `LANE_VEHICLES` rather than a literal pair, so
                  adding a vehicle is one entry in `lanes.ts` and a label,
                  not a third branch of a ternary. Wraps, because three
                  chips no longer fit one line on a phone. */}
              <div className="flex flex-wrap gap-2">
                {LANE_VEHICLES.map((vehicle) => (
                  <Chip
                    key={vehicle}
                    active={draft.vehicle === vehicle}
                    onClick={() => update({ vehicle })}
                  >
                    {dict.partnerDashboard.lanes.vehicles[vehicle]}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="lane-capacity" className="mb-2 block text-[13.5px]">
                {dx.spaceFree}
                <span className="ms-2 text-[12px] text-muted-foreground">m³</span>
              </label>
              <Input
                id="lane-capacity"
                inputMode="numeric"
                value={draft.capacityM3}
                onChange={(event) =>
                  update({ capacityM3: event.target.value.replace(/[^\d]/g, "").slice(0, 4) })
                }
                placeholder={dx.capacityPlaceholder}
                className="h-12 rounded-2xl tnum"
              />
            </div>
          </div>

          <div>
            <span className="mb-2 block text-[13.5px]">{dx.mode}</span>
            <div className="flex flex-wrap gap-2">
              {LANE_MODES.map((mode) => {
                const Icon = MODE_ICONS[mode];
                return (
                  <Chip key={mode} active={draft.mode === mode} onClick={() => update({ mode })}>
                    <Icon className="size-3.5" />
                    <span>{dict.enums.modes[mode].label}</span>
                  </Chip>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="lane-notes" className="mb-2 block text-[13.5px]">
              {dx.note}
              <span className="ms-2 text-[12px] text-muted-foreground">
                {dx.noteHint}
              </span>
            </label>
            <Textarea
              id="lane-notes"
              rows={2}
              value={draft.notes}
              onChange={(event) => update({ notes: event.target.value.slice(0, 240) })}
              placeholder={dx.notePlaceholder}
              className="rounded-2xl"
            />
          </div>

          {error && (
            <p role="alert" className="text-[13.5px] text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="mt-7">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-4 py-2.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {dx.cancel}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-[14.5px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985] disabled:opacity-70"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {editing ? dx.saveChanges : dx.addLane}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- */

function KindCard({
  selected,
  onSelect,
  icon,
  title,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-background p-3.5 text-start transition-all duration-200 outline-none",
        "hover:border-foreground/25 focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20",
        selected && "border-brand bg-brand-soft shadow-[0_0_0_1px_var(--brand)] dark:bg-accent",
      )}
    >
      <span className={cn("mt-0.5 shrink-0 text-muted-foreground", selected && "text-brand")}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13.5px] transition-all duration-200 outline-none",
        "hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-brand/20",
        active ? "border-brand bg-brand text-ink" : "bg-background",
      )}
    >
      {children}
    </button>
  );
}

function SwitchRow({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border bg-background p-3.5 text-start transition-all duration-200 outline-none",
        "hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-brand/20",
        checked && "border-brand/60 bg-brand-soft dark:bg-accent/60",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
          {hint}
        </span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
          checked ? "bg-brand" : "bg-muted-foreground/25",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
