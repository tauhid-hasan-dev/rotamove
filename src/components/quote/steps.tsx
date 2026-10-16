"use client";

import {
  Building2,
  CalendarDays,
  Mail,
  MessageCircle,
  Package,
  PackageOpen,
  Phone,
  Sparkles,
  Truck,
} from "lucide-react";
import { FieldSet, OptionCard, SwitchRow, ToggleChip } from "@/components/quote/fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ACCESS_OPTIONS,
  PROPERTY_SIZES,
  SPECIAL_ITEM_LABELS,
  estimateVolume,
} from "@/lib/pricing";
import { todayIso } from "@/lib/format";
import type {
  AccessType,
  ContactChannel,
  LeadDraft,
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
  const setSize = (size: PropertySize) =>
    update({ propertySize: size, volumeM3: estimateVolume(size) });

  return (
    <div className="space-y-9">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {PROPERTY_SIZES.map((option) => (
          <OptionCard
            key={option.id}
            selected={draft.propertySize === option.id}
            onSelect={() => setSize(option.id)}
            title={option.label}
            meta={`${option.volume} m³`}
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

      <FieldSet legend="Fine-tune the volume">
        <div className="rounded-3xl border bg-surface p-6">
          <div className="flex items-end justify-between gap-4">
            <p className="text-[38px] font-medium leading-none tracking-[-0.04em] tnum">
              {draft.volumeM3}
              <span className="ml-1 text-[17px] text-muted-foreground">m³</span>
            </p>
            <p className="text-[13px] text-muted-foreground">
              ≈ {Math.round(draft.volumeM3 * 4.2)} boxes
            </p>
          </div>
          <Slider
            className="mt-7"
            value={[draft.volumeM3]}
            min={4}
            max={140}
            step={1}
            onValueChange={([v]) => update({ volumeM3: v })}
            aria-label="Volume in cubic metres"
          />
        </div>
      </FieldSet>

      <div className="grid gap-6 sm:grid-cols-2">
        {(["origin", "destination"] as const).map((end) => (
          <FieldSet key={end} legend={end === "origin" ? "Access at pickup" : "Access at delivery"}>
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
                  title={option.label}
                />
              ))}
              <SwitchRow
                checked={draft[end].easyParking}
                onChange={(v) => update((d) => ({ ...d, [end]: { ...d[end], easyParking: v } }))}
                title="Truck can park at the door"
              />
            </div>
          </FieldSet>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Timing -- */

const FLEX_OPTIONS = [
  { id: "exact", label: "That exact date" },
  { id: "plus_minus_3", label: "Within 3 days" },
  { id: "within_2_weeks", label: "Within 2 weeks" },
  { id: "flexible", label: "Fully flexible" },
] as const;

export function StepTiming({ draft, update }: StepProps) {
  const month = new Date(draft.moveDate).getMonth();
  const peak = month >= 5 && month <= 8;

  return (
    <div className="space-y-9">
      <div className="relative max-w-sm">
        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" />
        <Input
          type="date"
          value={draft.moveDate}
          min={todayIso()}
          onChange={(e) => update({ moveDate: e.target.value })}
          className="h-14 rounded-2xl pl-11 text-[16px] tnum"
          aria-label="Move date"
        />
      </div>

      <FieldSet legend="How flexible?">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {FLEX_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              compact
              selected={draft.flexibility === option.id}
              onSelect={() => update({ flexibility: option.id })}
              title={option.label}
            />
          ))}
        </div>
      </FieldSet>

      {peak && (
        <p className="flex items-start gap-2.5 rounded-2xl bg-brand-soft p-4 text-[13.5px] leading-relaxed dark:bg-accent">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          June to September is peak season. Shifting a fortnight either way opens up a lot more
          capacity.
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Services -- */

const SERVICE_LEVELS: Array<{ id: ServiceLevel; label: string; hint: string; icon: React.ReactNode }> = [
  {
    id: "full_service",
    label: "Full service",
    hint: "They pack, load, ship and unpack.",
    icon: <Sparkles className="size-4" />,
  },
  {
    id: "door_to_door",
    label: "Door to door",
    hint: "You pack boxes, they do the rest.",
    icon: <Truck className="size-4" />,
  },
  {
    id: "transport_only",
    label: "Transport only",
    hint: "Everything is ready to collect.",
    icon: <PackageOpen className="size-4" />,
  },
];

export function StepServices({ draft, update }: StepProps) {
  const setExtra = <K extends keyof LeadDraft["extras"]>(
    key: K,
    value: LeadDraft["extras"][K],
  ) => update((d) => ({ ...d, extras: { ...d.extras, [key]: value } }));

  return (
    <div className="space-y-9">
      <div className="grid gap-2.5">
        {SERVICE_LEVELS.map((level) => (
          <OptionCard
            key={level.id}
            selected={draft.serviceLevel === level.id}
            onSelect={() => update({ serviceLevel: level.id })}
            title={level.label}
            hint={level.hint}
            icon={level.icon}
          />
        ))}
      </div>

      <FieldSet legend="Add-ons">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <SwitchRow
            checked={draft.extras.packing}
            onChange={(v) => setExtra("packing", v)}
            title="Packing"
          />
          <SwitchRow
            checked={draft.extras.unpacking}
            onChange={(v) => setExtra("unpacking", v)}
            title="Unpacking"
          />
          <SwitchRow
            checked={draft.extras.dismantling}
            onChange={(v) => setExtra("dismantling", v)}
            title="Dismantle & rebuild furniture"
          />
          <SwitchRow
            checked={draft.extras.insurance}
            onChange={(v) => setExtra("insurance", v)}
            title="Transit insurance"
          />
          <SwitchRow
            checked={draft.extras.customsClearance}
            onChange={(v) => setExtra("customsClearance", v)}
            title="Customs handled for me"
          />
          <SwitchRow
            checked={draft.extras.cleaning}
            onChange={(v) => setExtra("cleaning", v)}
            title="End-of-tenancy cleaning"
          />
        </div>
      </FieldSet>

      <FieldSet legend="Storage">
        <div className="rounded-3xl border bg-surface p-6">
          <p className="text-[26px] font-medium leading-none tnum">
            {draft.extras.storageWeeks === 0
              ? "None"
              : `${draft.extras.storageWeeks} week${draft.extras.storageWeeks > 1 ? "s" : ""}`}
          </p>
          <Slider
            className="mt-6"
            value={[draft.extras.storageWeeks]}
            min={0}
            max={26}
            step={1}
            onValueChange={([v]) => setExtra("storageWeeks", v)}
            aria-label="Weeks of storage"
          />
        </div>
      </FieldSet>

      <FieldSet legend="Anything specialist?">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SPECIAL_ITEM_LABELS) as Array<keyof SpecialItems>).map((key) => (
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
              {SPECIAL_ITEM_LABELS[key]}
            </ToggleChip>
          ))}
        </div>
      </FieldSet>
    </div>
  );
}

/* ------------------------------------------------------------ Contact -- */

const CHANNELS: Array<{ id: ContactChannel; label: string; icon: React.ReactNode }> = [
  { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="size-4" /> },
  { id: "phone", label: "Call", icon: <Phone className="size-4" /> },
  { id: "email", label: "Email", icon: <Mail className="size-4" /> },
];

export function StepContact({ draft, update, touched }: StepProps & { touched: boolean }) {
  const setContact = <K extends keyof LeadDraft["contact"]>(
    key: K,
    value: LeadDraft["contact"][K],
  ) => update((d) => ({ ...d, contact: { ...d.contact, [key]: value } }));

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contact.email.trim());
  const phoneOk = draft.contact.phone.replace(/\D/g, "").length >= 7;
  const nameOk = draft.contact.fullName.trim().length >= 2;

  return (
    <div className="space-y-8">
      <FieldSet legend="Preferred channel">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {CHANNELS.map((channel) => (
            <OptionCard
              key={channel.id}
              compact
              selected={draft.contact.channel === channel.id}
              onSelect={() => setContact("channel", channel.id)}
              title={channel.label}
              icon={channel.icon}
            />
          ))}
        </div>
      </FieldSet>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="fullName" className="mb-2 block text-[13.5px]">
            Name
          </Label>
          <Input
            id="fullName"
            value={draft.contact.fullName}
            onChange={(e) => setContact("fullName", e.target.value)}
            placeholder="Elif Yılmaz"
            autoComplete="name"
            className={cn("h-12 rounded-2xl", touched && !nameOk && "border-destructive")}
          />
        </div>

        <div>
          <Label htmlFor="email" className="mb-2 block text-[13.5px]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={draft.contact.email}
            onChange={(e) => setContact("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={cn("h-12 rounded-2xl", touched && !emailOk && "border-destructive")}
          />
        </div>

        <div>
          <Label htmlFor="phone" className="mb-2 block text-[13.5px]">
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={draft.contact.phone}
            onChange={(e) => setContact("phone", e.target.value)}
            placeholder="+90 532 000 00 00"
            autoComplete="tel"
            className={cn("h-12 rounded-2xl tnum", touched && !phoneOk && "border-destructive")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="mb-2 block text-[13.5px]">
          Anything else? <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={3}
          placeholder="Narrow street, no lift at the destination…"
          className="resize-none rounded-2xl"
        />
      </div>

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
          Share my enquiry with matching movers. Your details never go anywhere else.
        </span>
      </label>
    </div>
  );
}
