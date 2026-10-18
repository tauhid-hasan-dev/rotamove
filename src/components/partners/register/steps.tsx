"use client";

import { Building2, Globe2, Plane, Ship, Train, Truck } from "lucide-react";
import { FieldSet, OptionCard, ToggleChip } from "@/components/quote/fields";
import { DocumentField } from "@/components/partners/register/document-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/geo";
import {
  AVAILABILITY,
  COMPANY_SIZES,
  FLEET_OWNERSHIP,
  MEMBERSHIPS,
  MODE_KEYS,
  REGION_KEYS,
  SERVICE_KEYS,
} from "@/lib/partner-application";
import { LOCALES, LOCALE_META } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { regionName } from "@/i18n/geo-labels";
import type { ApplicationDraft } from "@/components/partners/register/use-application-draft";
import { cn } from "@/lib/utils";

export type StepProps = {
  draft: ApplicationDraft;
  update: (patch: Partial<ApplicationDraft>) => void;
  /** Set once the step has been submitted, so errors appear on intent. */
  touched: boolean;
  invalid: Set<string>;
};

/** Accreditation bodies are proper nouns — never translated. */
const MEMBERSHIP_LABELS: Record<string, string> = {
  fidi_faim: "FIDI / FAIM",
  iam: "IAM",
  amo: "AMÖ",
  bar: "BAR",
  iata: "IATA",
  iso_9001: "ISO 9001",
  tobb: "TOBB",
  none: "—",
};

const MODE_ICONS = { road: Truck, sea: Ship, air: Plane, rail: Train } as const;

/** Shared label + required/optional marker. */
function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  const { dict } = useI18n();
  return (
    <Label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-2 text-[13.5px]">
      <span>{children}</span>
      {!required && (
        <span className="text-[12px] font-normal text-muted-foreground">
          {dict.register.optional}
        </span>
      )}
    </Label>
  );
}

const field = (invalid: Set<string>, touched: boolean, key: string) =>
  cn("h-12 rounded-2xl", touched && invalid.has(key) && "border-destructive");

/* --------------------------------------------------------- 1 · Company -- */

export function StepCompany({ draft, update, touched, invalid }: StepProps) {
  const { dict } = useI18n();
  const R = dict.register;
  const sizeLabel = { micro: R.sizeMicro, small: R.sizeSmall, medium: R.sizeMedium, large: R.sizeLarge };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="legalName" required>
            {R.legalName}
          </FieldLabel>
          <Input
            id="legalName"
            value={draft.legalName}
            onChange={(e) => update({ legalName: e.target.value })}
            className={field(invalid, touched, "legalName")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="tradingName">{R.tradingName}</FieldLabel>
          <Input
            id="tradingName"
            value={draft.tradingName}
            onChange={(e) => update({ tradingName: e.target.value })}
            className="h-12 rounded-2xl"
          />
        </div>

        <div>
          <FieldLabel htmlFor="website">{R.website}</FieldLabel>
          <Input
            id="website"
            inputMode="url"
            placeholder="rotamove.com"
            value={draft.website}
            onChange={(e) => update({ website: e.target.value })}
            className="h-12 rounded-2xl"
          />
        </div>

        <div>
          <FieldLabel htmlFor="countryIso" required>
            {R.country}
          </FieldLabel>
          <Select value={draft.countryIso} onValueChange={(v) => update({ countryIso: v })}>
            <SelectTrigger
              id="countryIso"
              className={cn(
                "!h-12 w-full rounded-2xl",
                touched && invalid.has("countryIso") && "border-destructive",
              )}
            >
              <SelectValue placeholder={R.country} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.iso} value={c.iso}>
                  <span className="me-2" aria-hidden>
                    {c.flag}
                  </span>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel htmlFor="city" required>
            {R.city}
          </FieldLabel>
          <Input
            id="city"
            value={draft.city}
            onChange={(e) => update({ city: e.target.value })}
            className={field(invalid, touched, "city")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="foundedYear" required>
            {R.foundedYear}
          </FieldLabel>
          <Input
            id="foundedYear"
            type="number"
            inputMode="numeric"
            min={1900}
            max={new Date().getFullYear()}
            value={draft.foundedYear}
            onChange={(e) => update({ foundedYear: Number(e.target.value) })}
            className={cn(field(invalid, touched, "foundedYear"), "tnum")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="size" required>
            {R.size}
          </FieldLabel>
          <Select value={draft.size} onValueChange={(v) => update({ size: v })}>
            <SelectTrigger id="size" className="!h-12 w-full rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {sizeLabel[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- 2 · Contact -- */

export function StepContact({ draft, update, touched, invalid }: StepProps) {
  const { dict } = useI18n();
  const R = dict.register;

  const toggleLanguage = (code: (typeof LOCALES)[number]) =>
    update({
      languages: draft.languages.includes(code)
        ? draft.languages.filter((l) => l !== code)
        : [...draft.languages, code],
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="contactName" required>
            {R.contactName}
          </FieldLabel>
          <Input
            id="contactName"
            autoComplete="name"
            value={draft.contactName}
            onChange={(e) => update({ contactName: e.target.value })}
            className={field(invalid, touched, "contactName")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="contactRole" required>
            {R.contactRole}
          </FieldLabel>
          <Input
            id="contactRole"
            value={draft.contactRole}
            onChange={(e) => update({ contactRole: e.target.value })}
            className={field(invalid, touched, "contactRole")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="email" required>
            {R.email}
          </FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={draft.email}
            onChange={(e) => update({ email: e.target.value })}
            className={field(invalid, touched, "email")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="phone" required>
            {R.phone}
          </FieldLabel>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={draft.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className={cn(field(invalid, touched, "phone"), "tnum")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="altPhone">{R.altPhone}</FieldLabel>
          <Input
            id="altPhone"
            type="tel"
            inputMode="tel"
            value={draft.altPhone}
            onChange={(e) => update({ altPhone: e.target.value })}
            className="h-12 rounded-2xl tnum"
          />
        </div>
      </div>

      <FieldSet legend={R.languages}>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((code) => (
            <ToggleChip
              key={code}
              active={draft.languages.includes(code)}
              onToggle={() => toggleLanguage(code)}
            >
              {/* Endonyms: a carrier scans for the word they use themselves. */}
              {LOCALE_META[code].native}
            </ToggleChip>
          ))}
        </div>
        {touched && invalid.has("languages") && (
          <p className="mt-2 text-[12.5px] text-destructive">{R.fixErrors}</p>
        )}
      </FieldSet>
    </div>
  );
}

/* ----------------------------------------------------- 3 · Credentials -- */

export function StepCredentials({ draft, update, touched, invalid }: StepProps) {
  const { dict, t } = useI18n();
  const R = dict.register;

  const toggleMembership = (id: string) =>
    update({
      memberships: draft.memberships.includes(id)
        ? draft.memberships.filter((m) => m !== id)
        : [...draft.memberships.filter((m) => m !== "none" && id !== "none"), id],
    });

  return (
    <div className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="registrationNumber" required>
            {R.registrationNumber}
          </FieldLabel>
          <Input
            id="registrationNumber"
            value={draft.registrationNumber}
            onChange={(e) => update({ registrationNumber: e.target.value })}
            className={cn(field(invalid, touched, "registrationNumber"), "tnum")}
          />
        </div>

        <div>
          <FieldLabel htmlFor="vatNumber">{R.vatNumber}</FieldLabel>
          <Input
            id="vatNumber"
            value={draft.vatNumber}
            onChange={(e) => update({ vatNumber: e.target.value })}
            className="h-12 rounded-2xl tnum"
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="transportLicence" required>
            {R.transportLicence}
          </FieldLabel>
          <Input
            id="transportLicence"
            value={draft.transportLicence}
            onChange={(e) => update({ transportLicence: e.target.value })}
            className={cn(field(invalid, touched, "transportLicence"), "tnum")}
          />
        </div>
      </div>

      {/* Cover amounts, not a yes/no — "insured" without a figure is noise. */}
      <FieldSet legend={R.cargoCover} hint={R.coverHint}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="cargoCoverEur" required>
              {R.cargoCover}
            </FieldLabel>
            <Input
              id="cargoCoverEur"
              type="number"
              inputMode="numeric"
              min={0}
              step={10000}
              value={draft.cargoCoverEur}
              onChange={(e) => update({ cargoCoverEur: Number(e.target.value) })}
              className={cn(field(invalid, touched, "cargoCoverEur"), "tnum")}
            />
            <p className="mt-1.5 text-[12px] text-muted-foreground tnum">
              €{t.number(draft.cargoCoverEur || 0)}
            </p>
          </div>
          <div>
            <FieldLabel htmlFor="liabilityCoverEur" required>
              {R.liabilityCover}
            </FieldLabel>
            <Input
              id="liabilityCoverEur"
              type="number"
              inputMode="numeric"
              min={0}
              step={10000}
              value={draft.liabilityCoverEur}
              onChange={(e) => update({ liabilityCoverEur: Number(e.target.value) })}
              className={cn(field(invalid, touched, "liabilityCoverEur"), "tnum")}
            />
            <p className="mt-1.5 text-[12px] text-muted-foreground tnum">
              €{t.number(draft.liabilityCoverEur || 0)}
            </p>
          </div>
        </div>
      </FieldSet>

      <FieldSet legend={R.memberships} hint={R.membershipsHint}>
        <div className="flex flex-wrap gap-2">
          {MEMBERSHIPS.filter((m) => m !== "none").map((id) => (
            <ToggleChip
              key={id}
              active={draft.memberships.includes(id)}
              onToggle={() => toggleMembership(id)}
            >
              {MEMBERSHIP_LABELS[id]}
            </ToggleChip>
          ))}
        </div>
      </FieldSet>

      <FieldSet legend={R.documents}>
        <div className="space-y-3">
          <DocumentField
            id="registrationDoc"
            label={R.docRegistration}
            required
            value={draft.registrationDoc}
            onChange={(v) => update({ registrationDoc: v })}
            invalid={touched && invalid.has("registrationDoc")}
          />
          <DocumentField
            id="insuranceDoc"
            label={R.docInsurance}
            required
            value={draft.insuranceDoc}
            onChange={(v) => update({ insuranceDoc: v })}
            invalid={touched && invalid.has("insuranceDoc")}
          />
          <DocumentField
            id="licenceDoc"
            label={R.docLicence}
            value={draft.licenceDoc}
            onChange={(v) => update({ licenceDoc: v })}
          />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {R.docDemoNote}
          </p>
        </div>
      </FieldSet>
    </div>
  );
}

/* ----------------------------------------------------------- 4 · Fleet -- */

export function StepFleet({ draft, update, touched, invalid }: StepProps) {
  const { dict, t } = useI18n();
  const R = dict.register;
  const ownLabel = {
    owned: R.ownOwned,
    leased: R.ownLeased,
    mixed: R.ownMixed,
    subcontracted: R.ownSubcontracted,
  };

  const toggle = (key: "modes" | "services", id: string) =>
    update({
      [key]: draft[key].includes(id) ? draft[key].filter((v) => v !== id) : [...draft[key], id],
    } as Partial<ApplicationDraft>);

  return (
    <div className="space-y-7">
      <FieldSet legend={R.lorries} hint={R.fleetHint}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="lorries" required>
              {R.lorries}
            </FieldLabel>
            <Input
              id="lorries"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.lorries}
              onChange={(e) => update({ lorries: Number(e.target.value) })}
              className={cn(field(invalid, touched, "lorries"), "tnum")}
            />
          </div>
          <div>
            <FieldLabel htmlFor="vans" required>
              {R.vans}
            </FieldLabel>
            <Input
              id="vans"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.vans}
              onChange={(e) => update({ vans: Number(e.target.value) })}
              className={cn(field(invalid, touched, "vans"), "tnum")}
            />
          </div>
        </div>
      </FieldSet>

      <FieldSet legend={R.ownership}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {FLEET_OWNERSHIP.map((id) => (
            <OptionCard
              key={id}
              compact
              selected={draft.ownership === id}
              onSelect={() => update({ ownership: id })}
              title={ownLabel[id]}
              icon={<Building2 className="size-4" />}
            />
          ))}
        </div>
      </FieldSet>

      <FieldSet legend={R.capacity} hint={R.capacityHint}>
        <div className="max-w-xs">
          <Input
            id="weeklyCapacityM3"
            type="number"
            inputMode="numeric"
            min={1}
            step={10}
            value={draft.weeklyCapacityM3}
            onChange={(e) => update({ weeklyCapacityM3: Number(e.target.value) })}
            className={cn(field(invalid, touched, "weeklyCapacityM3"), "tnum")}
          />
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {t.volume(draft.weeklyCapacityM3 || 0)}
          </p>
        </div>
      </FieldSet>

      <FieldSet legend={R.modes}>
        <div className="flex flex-wrap gap-2">
          {MODE_KEYS.map((id) => {
            const Icon = MODE_ICONS[id];
            return (
              <ToggleChip key={id} active={draft.modes.includes(id)} onToggle={() => toggle("modes", id)}>
                <Icon className="size-3.5" />
                {dict.enums.modes[id].label}
              </ToggleChip>
            );
          })}
        </div>
        {touched && invalid.has("modes") && (
          <p className="mt-2 text-[12.5px] text-destructive">{R.fixErrors}</p>
        )}
      </FieldSet>

      <FieldSet legend={R.services}>
        <div className="flex flex-wrap gap-2">
          {SERVICE_KEYS.map((id) => (
            <ToggleChip
              key={id}
              active={draft.services.includes(id)}
              onToggle={() => toggle("services", id)}
            >
              {dict.filters.services[id]}
            </ToggleChip>
          ))}
        </div>
      </FieldSet>
    </div>
  );
}

/* -------------------------------------------------------- 5 · Coverage -- */

export function StepCoverage({ draft, update, touched, invalid }: StepProps) {
  const { dict } = useI18n();
  const R = dict.register;
  const availLabel = {
    immediate: R.availImmediate,
    within_week: R.availWeek,
    within_month: R.availMonth,
  };

  const toggleRegion = (id: string) =>
    update({
      regions: draft.regions.includes(id)
        ? draft.regions.filter((r) => r !== id)
        : [...draft.regions, id],
    });

  return (
    <div className="space-y-7">
      <FieldSet legend={R.regions} hint={R.regionsHint}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {REGION_KEYS.map((id) => (
            <OptionCard
              key={id}
              compact
              selected={draft.regions.includes(id)}
              onSelect={() => toggleRegion(id)}
              title={regionName(dict, id)}
              icon={<Globe2 className="size-4" />}
            />
          ))}
        </div>
        {touched && invalid.has("regions") && (
          <p className="mt-2 text-[12.5px] text-destructive">{R.fixErrors}</p>
        )}
      </FieldSet>

      <FieldSet legend={R.availability}>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {AVAILABILITY.map((id) => (
            <OptionCard
              key={id}
              compact
              selected={draft.availability === id}
              onSelect={() => update({ availability: id })}
              title={availLabel[id]}
            />
          ))}
        </div>
      </FieldSet>

      <div>
        <FieldLabel htmlFor="notes">{R.notes}</FieldLabel>
        <Textarea
          id="notes"
          rows={3}
          value={draft.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder={R.notesPlaceholder}
          className="resize-none rounded-2xl"
        />
      </div>

      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
          draft.declaration && "border-brand bg-brand-soft dark:bg-accent",
          touched && invalid.has("declaration") && "border-destructive",
        )}
      >
        <Checkbox
          checked={draft.declaration}
          onCheckedChange={(v) => update({ declaration: v === true })}
          className="mt-0.5"
        />
        <span className="text-[13px] leading-relaxed text-muted-foreground">
          {R.declaration}
        </span>
      </label>
    </div>
  );
}
