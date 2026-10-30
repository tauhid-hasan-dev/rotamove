"use client";

import {
  Building2,
  Check,
  Container,
  Mail,
  MessageCircle,
  Package,
  PackageOpen,
  Phone,
  Snowflake,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { FieldSet, OptionCard, SwitchRow, ToggleChip } from "@/components/quote/fields";
import { VerifyField } from "@/components/quote/verify-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ACCESS_OPTIONS, PROPERTY_SIZES, estimateVolume } from "@/lib/pricing";
import { useI18n } from "@/i18n/provider";
import type { Dictionary } from "@/i18n/dictionaries";
import type {
  AccessType,
  ContactChannel,
  LeadDraft,
  MatchCount,
  PropertySize,
  ServiceLevel,
  SpecialItems,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type StepProps = {
  draft: LeadDraft;
  update: (patch: Partial<LeadDraft> | ((d: LeadDraft) => LeadDraft)) => void;
};

/* --------------------------------------------------------------- Home -- */

/**
 * Icons for the sizes that are not a home.
 *
 * Everything from a few boxes to a villa is the same job at a different
 * scale, so it takes the same crate mark. The three that are a different job
 * entirely — an office clearance, out-of-gauge project freight, a reefer run
 * — get their own, because that is the distinction worth drawing in a grid
 * someone scans rather than reads.
 */
const SIZE_ICONS: Partial<Record<PropertySize, React.ReactNode>> = {
  office: <Building2 className="size-4" />,
  project: <Container className="size-4" />,
  reefer: <Snowflake className="size-4" />,
};

export function StepHome({ draft, update }: StepProps) {
  const { dict, t } = useI18n();

  const setSize = (size: PropertySize) =>
    update({ propertySize: size, volumeM3: estimateVolume(size) });

  return (
    <div className="space-y-9">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {/* Ids and volumes come from the pricing model; the words come from the
            dictionary. Adding a size is a one-line change in two places, not a
            copy hunt across eight files. */}
        {PROPERTY_SIZES.map((option) => (
          <OptionCard
            key={option.id}
            selected={draft.propertySize === option.id}
            onSelect={() => setSize(option.id)}
            title={dict.enums.propertySize[option.id].label}
            meta={t.volume(option.volume)}
            icon={SIZE_ICONS[option.id] ?? <Package className="size-4" />}
          />
        ))}
      </div>

      <FieldSet legend={dict.quote.fineTuneVolume}>
        <div className="rounded-3xl border bg-surface p-6">
          <div className="flex items-end justify-between gap-4">
            <p className="text-[38px] font-medium leading-none tracking-[-0.04em] tnum">
              {t.number(draft.volumeM3)}
              <span className="ms-1 text-[17px] text-muted-foreground">m³</span>
            </p>
            <p className="text-[13px] text-muted-foreground">
              {t.fill(dict.quote.approxBoxes, {
                boxes: t.count(dict.units.boxes, Math.round(draft.volumeM3 * 4.2)),
              })}
            </p>
          </div>
          <Slider
            className="mt-7"
            value={[draft.volumeM3]}
            min={4}
            max={140}
            step={1}
            onValueChange={([v]) => update({ volumeM3: v })}
            aria-label={dict.quote.volumeAria}
          />
        </div>
      </FieldSet>

      <div className="grid gap-6 sm:grid-cols-2">
        {(["origin", "destination"] as const).map((end) => (
          <FieldSet
            key={end}
            legend={end === "origin" ? dict.quote.accessPickup : dict.quote.accessDelivery}
          >
            <div className="space-y-2">
              {ACCESS_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  compact
                  selected={draft[end].access === option.id}
                  onSelect={() =>
                    update((d) => ({
                      ...d,
                      [end]: { ...d[end], access: option.id as AccessType },
                    }))
                  }
                  title={dict.enums.access[option.id].label}
                />
              ))}
              <SwitchRow
                checked={draft[end].easyParking}
                onChange={(v) => update((d) => ({ ...d, [end]: { ...d[end], easyParking: v } }))}
                title={dict.quote.parkAtDoor}
              />
            </div>
          </FieldSet>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- Services -- */

const SERVICE_ICONS: Record<ServiceLevel, React.ReactNode> = {
  full_service: <Sparkles className="size-4" />,
  door_to_door: <Truck className="size-4" />,
  transport_only: <PackageOpen className="size-4" />,
};

const SERVICE_ORDER: ServiceLevel[] = ["full_service", "door_to_door", "transport_only"];

const EXTRA_TOGGLES = [
  "packing",
  "unpacking",
  "dismantling",
  "insurance",
  "customsClearance",
  "cleaning",
] as const satisfies ReadonlyArray<keyof Dictionary["quote"]["extras"]>;

/**
 * How long we assume a yes means.
 *
 * Storage used to be asked twice — whether, then how many weeks on a slider.
 * The duration is a detail the carrier settles on the call, and asking for it
 * here put a second control in front of every customer to refine a figure
 * nobody is held to. Four weeks is the figure the pricing copy already quotes
 * and the one a month of bonded storage costs, so a yes books that and the
 * conversation adjusts it.
 */
const DEFAULT_STORAGE_WEEKS = 4;

export function StepServices({ draft, update }: StepProps) {
  const { dict } = useI18n();

  const setExtra = <K extends keyof LeadDraft["extras"]>(key: K, value: LeadDraft["extras"][K]) =>
    update((d) => ({ ...d, extras: { ...d.extras, [key]: value } }));

  /*
   * Derived, not stored. "Wants storage" is exactly "more than nought weeks",
   * so there is no second field to be contradicted by the first — and no
   * change to the lead schema, the URL codec or the fee function, all of
   * which already treat `storageWeeks > 0` as the fact that matters.
   */
  const wantsStorage = draft.extras.storageWeeks > 0;

  return (
    <div className="space-y-9">
      <div className="grid gap-2.5">
        {SERVICE_ORDER.map((id) => (
          <OptionCard
            key={id}
            selected={draft.serviceLevel === id}
            onSelect={() => update({ serviceLevel: id })}
            title={dict.enums.serviceLevel[id].label}
            hint={dict.enums.serviceLevel[id].hint}
            icon={SERVICE_ICONS[id]}
          />
        ))}
      </div>

      <FieldSet legend={dict.quote.addOns}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {EXTRA_TOGGLES.map((key) => (
            <SwitchRow
              key={key}
              checked={draft.extras[key]}
              onChange={(v) => setExtra(key, v)}
              title={dict.quote.extras[key]}
            />
          ))}
        </div>
      </FieldSet>

      {/* Storage: one question, two answers.
          This was a yes/no pair with a sentence of explanation each, and a
          0–26 week slider that unfolded underneath a yes. Three controls for
          a question whose answer the carrier settles on the call. */}
      <FieldSet legend={dict.quote.storageLegend}>
        <div className="grid max-w-sm gap-2.5 sm:grid-cols-2">
          <OptionCard
            compact
            selected={wantsStorage}
            onSelect={() => setExtra("storageWeeks", DEFAULT_STORAGE_WEEKS)}
            title={dict.common.yes}
          />
          <OptionCard
            compact
            selected={!wantsStorage}
            onSelect={() => setExtra("storageWeeks", 0)}
            title={dict.common.no}
          />
        </div>
      </FieldSet>

      <FieldSet legend={dict.quote.specialistLegend}>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(dict.enums.specialItems) as Array<keyof SpecialItems>).map((key) => (
            <ToggleChip
              key={key}
              active={draft.specialItems[key]}
              onToggle={() =>
                update((d) => ({
                  ...d,
                  specialItems: { ...d.specialItems, [key]: !d.specialItems[key] },
                }))
              }
            >
              {dict.enums.specialItems[key]}
            </ToggleChip>
          ))}
        </div>
      </FieldSet>
    </div>
  );
}

/* ------------------------------------------------------------ Contact -- */

const CHANNEL_ICONS: Record<ContactChannel, React.ReactNode> = {
  whatsapp: <MessageCircle className="size-4" />,
  phone: <Phone className="size-4" />,
  email: <Mail className="size-4" />,
  // Three overlapping marks rather than a fourth symbol: "any of these" is
  // easier to read as the set than as an abstract icon for it.
  all: (
    <span className="flex items-center -space-x-1">
      <MessageCircle className="size-4" />
      <Phone className="size-3.5" />
      <Mail className="size-3.5" />
    </span>
  ),
};

const CHANNEL_ORDER: ContactChannel[] = ["whatsapp", "phone", "email", "all"];

export function StepContact({
  draft,
  update,
  touched,
  hideMatchCount = false,
}: StepProps & {
  touched: boolean;
  /**
   * Last-call requests go to one named vehicle, so there is no "how many
   * carriers" decision to put to the customer.
   */
  hideMatchCount?: boolean;
}) {
  const { dict } = useI18n();

  const setContact = <K extends keyof LeadDraft["contact"]>(
    key: K,
    value: LeadDraft["contact"][K],
  ) => update((d) => ({ ...d, contact: { ...d.contact, [key]: value } }));

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contact.email.trim());
  const phoneOk = draft.contact.phone.replace(/\D/g, "").length >= 7;
  const nameOk = draft.contact.fullName.trim().length >= 2;

  return (
    <div className="space-y-8">
      <FieldSet legend={dict.quote.preferredChannel}>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNEL_ORDER.map((id) => (
            <OptionCard
              key={id}
              compact
              selected={draft.contact.channel === id}
              onSelect={() => setContact("channel", id)}
              title={dict.moverCard.channels[id].label}
              icon={CHANNEL_ICONS[id]}
            />
          ))}
        </div>
      </FieldSet>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName" className="mb-2 block text-[13.5px]">
            {dict.quote.name}
          </Label>
          <Input
            id="fullName"
            value={draft.contact.fullName}
            onChange={(e) => setContact("fullName", e.target.value)}
            placeholder={dict.quote.namePlaceholder}
            autoComplete="name"
            className={cn("h-12 rounded-2xl", touched && !nameOk && "border-destructive")}
          />
        </div>

        <VerifyField
          id="email"
          kind="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          label={dict.quote.email}
          placeholder={dict.quote.emailPlaceholder}
          value={draft.contact.email}
          onChange={(v) => setContact("email", v)}
          verified={draft.contact.emailVerified}
          onVerifiedChange={(v) => setContact("emailVerified", v)}
          valid={emailOk}
          invalid={touched && !emailOk}
        />

        <VerifyField
          id="phone"
          kind="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          label={dict.quote.phone}
          placeholder={dict.quote.phonePlaceholder}
          value={draft.contact.phone}
          onChange={(v) => setContact("phone", v)}
          verified={draft.contact.phoneVerified}
          onVerifiedChange={(v) => setContact("phoneVerified", v)}
          valid={phoneOk}
          invalid={touched && !phoneOk}
        />
      </div>

      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        {dict.verify.demoNote}
      </p>

      {/* Only nag once the user has actually tried to continue. */}
      {touched && emailOk && !draft.contact.emailVerified && (
        <p className="text-[13px] text-destructive">{dict.verify.emailNeedsVerifying}</p>
      )}
      {touched && phoneOk && !draft.contact.phoneVerified && (
        <p className="text-[13px] text-destructive">{dict.verify.phoneNeedsVerifying}</p>
      )}

      <div>
        <Label htmlFor="notes" className="mb-2 block text-[13.5px]">
          {dict.quote.notes}{" "}
          <span className="text-muted-foreground">{dict.common.optional}</span>
        </Label>
        <Textarea
          id="notes"
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={3}
          placeholder={dict.quote.notesPlaceholder}
          className="resize-none rounded-2xl"
        />
      </div>

      {!hideMatchCount && (
        <MatchCountPicker
          value={draft.preferredMatches}
          onChange={(v) => update({ preferredMatches: v })}
        />
      )}

      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
          draft.consent && "border-brand bg-brand-soft dark:bg-accent",
          touched && !draft.consent && "border-destructive",
        )}
      >
        <Checkbox
          checked={draft.consent}
          onCheckedChange={(v) => update({ consent: v === true })}
          className="mt-0.5"
        />
        <span className="text-[13px] leading-relaxed text-muted-foreground">
          {dict.quote.consent}
        </span>
      </label>
    </div>
  );
}

/* -------------------------------------------------- how many carriers -- */

/**
 * How many carriers should hear about this load.
 *
 * The single most common objection to a lead marketplace is "I submitted one
 * form and got nine phone calls". Asking the question outright — right before
 * consent, where the customer is already weighing who gets their number —
 * turns that fear into a choice, and the number is carried through to the
 * results board so what they picked is what they get.
 */
function MatchCountPicker({
  value,
  onChange,
}: {
  value: MatchCount;
  onChange: (value: MatchCount) => void;
}) {
  const { dict } = useI18n();

  const options: Array<{ id: MatchCount; label: string; hint: string; recommended?: boolean }> = [
    { id: 2, label: dict.quote.matchCount.two, hint: dict.quote.matchCount.twoHint },
    {
      id: 5,
      label: dict.quote.matchCount.five,
      hint: dict.quote.matchCount.fiveHint,
      recommended: true,
    },
    { id: null, label: dict.quote.matchCount.all, hint: dict.quote.matchCount.allHint },
  ];

  return (
    <FieldSet legend={dict.quote.matchCount.legend} hint={dict.quote.matchCount.hint}>
      <div role="radiogroup" aria-label={dict.quote.matchCount.legend} className="grid gap-2.5 sm:grid-cols-3">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={String(option.id)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                "group relative flex flex-col items-start gap-1 rounded-2xl border bg-background p-4 text-start transition-all duration-200 outline-none",
                "hover:border-foreground/25 hover:shadow-sm",
                "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20",
                selected &&
                  "border-brand bg-brand-soft shadow-[0_0_0_1px_var(--brand)] dark:bg-accent dark:shadow-[0_0_0_1px_var(--brand)]",
              )}
            >
              <span className="flex w-full items-center gap-2">
                <Users
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    selected ? "text-foreground" : "text-muted-foreground",
                  )}
                  strokeWidth={2}
                />
                <span className="text-[15px] font-medium">{option.label}</span>
                {selected && (
                  <span className="ms-auto grid size-4 shrink-0 place-items-center rounded-full bg-brand text-white">
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </span>
              <span className="text-[12.5px] leading-snug text-muted-foreground">
                {option.hint}
              </span>
              {option.recommended && !selected && (
                <span className="mt-1 rounded-full bg-muted px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {dict.quote.matchCount.recommended}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </FieldSet>
  );
}
