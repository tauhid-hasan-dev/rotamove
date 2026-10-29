"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { ToggleChip } from "@/components/quote/fields";
import { VerifyField } from "@/components/quote/verify-field";
import { PANEL } from "@/components/partners/dashboard/surface";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REGION_ORDER } from "@/lib/geo";
import { partnerProfileSchema, type PartnerProfile } from "@/lib/partner-profile";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { regionName } from "@/i18n/geo-labels";
import { cn } from "@/lib/utils";

/**
 * Account settings.
 *
 * Reached from the account menu rather than the section rail, because this is
 * where someone goes once a quarter and the rail is for the four things they
 * open daily. It still renders as a section of the workspace rather than its
 * own route — the partner keeps their sidebar, their plan panel and their
 * place.
 *
 * Changing the email address or the phone number means confirming the new one
 * by code before the form will save. That is the same rule the application
 * form applies, and for the same reason: every message this product sends
 * goes to these two fields, so an edit that is wrong silently cuts the account
 * off from its own approvals, document requests and billing notices. The
 * confirmation also makes the change expensive enough to be deliberate, which
 * is what you want of the field an account takeover has to move first.
 */

/** Good enough to decide whether to offer to send a code. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Draft = {
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  website: string;
  city: string;
  regions: string[];
  languages: Locale[];
  notes: string;
};

const toDraft = (p: PartnerProfile): Draft => ({
  contactName: p.contactName,
  contactRole: p.contactRole,
  email: p.email,
  phone: p.phone,
  website: p.website,
  city: p.city,
  regions: [...p.regions],
  languages: [...p.languages],
  notes: p.notes,
});

export function SettingsPanel({ profile }: { profile: PartnerProfile }) {
  const { dict, t } = useI18n();
  const st = dict.partnerDashboard.settings;

  const [saved, setSaved] = useState<PartnerProfile>(profile);
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  /*
   * Verification is tracked here rather than in the draft, and starts false
   * on every mount. A tick carried in from a previous visit would vouch for
   * an address this session never confirmed.
   *
   * The unchanged value counts as already confirmed — it is the address the
   * account was reached on. Only an edit re-opens the question, which is why
   * these are compared against `saved` rather than held as plain booleans.
   */
  const [emailOk, setEmailOk] = useState(false);
  const [phoneOk, setPhoneOk] = useState(false);

  const emailChanged = draft.email.trim() !== saved.email;
  const phoneChanged = draft.phone.trim() !== saved.phone;
  const emailVerified = !emailChanged || emailOk;
  const phoneVerified = !phoneChanged || phoneOk;

  const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  const toggle = <K extends "regions" | "languages">(key: K, value: string) =>
    setDraft((d) => {
      const list = d[key] as string[];
      return {
        ...d,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const payload = useMemo(
    () => ({ ...draft, emailVerified, phoneVerified }),
    [draft, emailVerified, phoneVerified],
  );

  const parsed = useMemo(() => partnerProfileSchema.safeParse(payload), [payload]);
  const invalid = useMemo(
    () =>
      parsed.success
        ? new Set<string>()
        : new Set(parsed.error.issues.map((i) => String(i.path[0]))),
    [parsed],
  );

  const dirty = useMemo(
    () => JSON.stringify(toDraft(saved)) !== JSON.stringify(draft),
    [saved, draft],
  );

  // Warn before losing edits to a closed tab. Registered only while there is
  // something to lose, so the prompt never fires on a page nobody changed.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    setTouched(true);
    if (!parsed.success) return;

    setSaving(true);
    try {
      const response = await fetch("/api/partners/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error("save failed");

      const { profile: next, changed } = (await response.json()) as {
        profile: PartnerProfile;
        changed: string[];
      };

      setSaved(next);
      setDraft(toDraft(next));
      // The new values are now the values on file, so they are confirmed by
      // definition and the next edit starts the question over.
      setEmailOk(false);
      setPhoneOk(false);
      setTouched(false);

      if (changed.length === 0) {
        toast.success(st.toastNoChanges);
      } else if (changed.some((f) => f === "email" || f === "phone")) {
        toast.success(st.toastSaved, { description: st.toastNotified });
      } else {
        toast.success(st.toastSaved);
      }
    } catch {
      toast.error(st.toastFailed);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setDraft(toDraft(saved));
    setEmailOk(false);
    setPhoneOk(false);
    setTouched(false);
  };

  const err = (key: string) => touched && invalid.has(key);

  return (
    <div className="mt-4 lg:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] tracking-[-0.03em]">{st.title}</h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{st.lede}</p>
        </div>
        {saved.updatedAt && (
          <p className="text-[12px] text-muted-foreground">
            {t.fill(st.lastSaved, { when: t.dateLong(saved.updatedAt) })}
          </p>
        )}
      </div>

      {/* contact ------------------------------------------------- */}
      <section className={cn(PANEL, "mt-5 p-6")}>
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {st.contactHeading}
        </h3>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            id="st-name"
            label={st.contactName}
            value={draft.contactName}
            onChange={(v) => set("contactName", v)}
            invalid={err("contactName")}
          />
          <Field
            id="st-role"
            label={st.contactRole}
            value={draft.contactRole}
            onChange={(v) => set("contactRole", v)}
            invalid={err("contactRole")}
          />

          <VerifyField
            className="sm:col-span-2"
            id="st-email"
            kind="email"
            label={st.email}
            placeholder={dict.register.emailPlaceholder}
            value={draft.email}
            onChange={(v) => set("email", v)}
            /* Unchanged counts as confirmed — this is the address the
               account is already reachable on, and making someone re-verify
               it to edit their city would be theatre. */
            verified={emailVerified}
            onVerifiedChange={setEmailOk}
            valid={EMAIL_RE.test(draft.email.trim())}
            invalid={err("email")}
            autoComplete="email"
            inputMode="email"
            type="email"
          />

          <VerifyField
            className="sm:col-span-2"
            id="st-phone"
            kind="phone"
            label={st.phone}
            placeholder={dict.register.phonePlaceholder}
            value={draft.phone}
            onChange={(v) => set("phone", v)}
            verified={phoneVerified}
            onVerifiedChange={setPhoneOk}
            valid={draft.phone.replace(/\D/g, "").length >= 7}
            invalid={err("phone")}
            autoComplete="tel"
            inputMode="tel"
            type="tel"
          />
        </div>

        {(emailChanged || phoneChanged) && (
          <p className="mt-4 rounded-xl bg-surface px-3.5 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {st.contactChangeNote}
          </p>
        )}
      </section>

      {/* company ------------------------------------------------- */}
      <section className={cn(PANEL, "mt-4 p-6")}>
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {st.companyHeading}
        </h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            id="st-city"
            label={st.city}
            value={draft.city}
            onChange={(v) => set("city", v)}
            invalid={err("city")}
          />
          <Field
            id="st-website"
            label={st.website}
            value={draft.website}
            onChange={(v) => set("website", v)}
            invalid={err("website")}
          />
        </div>

        <div className="mt-6">
          <Label htmlFor="st-notes" className="mb-2 block text-[13.5px]">
            {st.notes}
          </Label>
          <Textarea
            id="st-notes"
            rows={4}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={st.notesPlaceholder}
            className="rounded-2xl"
          />
          <p className="mt-2 text-[12px] text-muted-foreground">{st.notesHint}</p>
        </div>
      </section>

      {/* coverage ------------------------------------------------ */}
      <section className={cn(PANEL, "mt-4 p-6")}>
        <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {st.coverageHeading}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {st.coverageHint}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {REGION_ORDER.map((id) => (
            <ToggleChip
              key={id}
              active={draft.regions.includes(id)}
              onToggle={() => toggle("regions", id)}
            >
              {regionName(dict, id)}
            </ToggleChip>
          ))}
        </div>
        {err("regions") && (
          <p className="mt-2 text-[12.5px] text-destructive">{st.pickRegion}</p>
        )}

        <h3 className="mt-7 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {st.languagesHeading}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {st.languagesHint}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LOCALES.map((code) => (
            <ToggleChip
              key={code}
              active={draft.languages.includes(code)}
              onToggle={() => toggle("languages", code)}
            >
              {/* Endonyms: a carrier scans for the word they use themselves. */}
              {LOCALE_META[code].native}
            </ToggleChip>
          ))}
        </div>
        {err("languages") && (
          <p className="mt-2 text-[12.5px] text-destructive">{st.pickLanguage}</p>
        )}
      </section>

      {/* Above the save bar, not below it.
          The bar is sticky, so a message rendered after it sat underneath
          the viewport's bottom edge — you pressed Save, nothing appeared to
          happen, and the explanation was off-screen. */}
      {touched && invalid.size > 0 && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-destructive/10 px-3.5 py-3 text-[13px] text-destructive"
        >
          {/* Named when it is the only thing standing in the way, because
              "check the fields" sends someone hunting for a typo that is
              not there. */}
          {[...invalid].every((k) => k === "emailVerified" || k === "phoneVerified")
            ? st.verifyFirst
            : st.fixErrors}
        </p>
      )}

      {/* save bar ------------------------------------------------ */}
      <div className="sticky bottom-0 z-20 mt-4 flex flex-wrap items-center gap-3 border-t bg-background/92 py-4 backdrop-blur-xl">
        <p className="min-w-0 flex-1 text-[12.5px] text-muted-foreground">
          {dirty ? st.unsaved : st.allSaved}
        </p>

        {dirty && (
          <button
            type="button"
            onClick={reset}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {st.discard}
          </button>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className={cn(
            "inline-flex min-w-[150px] items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-[14.5px] font-medium text-ink transition-all duration-200",
            "hover:brightness-[0.97] active:scale-[0.985]",
            "disabled:opacity-45 disabled:hover:brightness-100 disabled:active:scale-100",
          )}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {st.saving}
            </>
          ) : dirty ? (
            <>
              <Save className="size-4" aria-hidden />
              {st.save}
            </>
          ) : (
            <>
              <Check className="size-4" strokeWidth={3} aria-hidden />
              {st.save}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-[13.5px]">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-12 rounded-2xl", invalid && "border-destructive")}
      />
    </div>
  );
}
