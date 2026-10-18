"use client";

import {
  Building2,
  Check,
  Mail,
  MessageCircle,
  Package,
  PackageOpen,
  Phone,
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
            icon={
              option.id === "office" ? (
                <Building2 className="size-4" />
              ) : (
                <Package className="size-4" />
              )
            }
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

export function StepServices({ draft, update }: StepProps) {
  const { dict, t } = useI18n();

  const setExtra = <K extends keyof LeadDraft["extras"]>(key: K, value: LeadDraft["extras"][K]) =>
    update((d) => ({ ...d, extras: { ...d.extras, [key]: value } }));

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

      <FieldSet legend={dict.quote.storageLegend}>
        <div className="rounded-3xl border bg-surface p-6">
          <p className="text-[26px] font-medium leading-none tnum">
            {t.weeks(draft.extras.storageWeeks)}
          </p>
          <Slider
            className="mt-6"
            value={[draft.extras.storageWeeks]}
            min={0}
            max={26}
            step={1}
            onValueChange={([v]) => setExtra("storageWeeks", v)}
            aria-label={dict.quote.storageAria}
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
};

const CHANNEL_ORDER: ContactChannel[] = ["whatsapp", "phone", "email"];

export function StepContact({ draft, update, touched }: StepProps & { touched: boolean }) {
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
        <div className="grid gap-2.5 sm:grid-cols-3">
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

      <MatchCountPicker
        value={draft.preferredMatches}
        onChange={(v) => update({ preferredMatches: v })}
      />

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
