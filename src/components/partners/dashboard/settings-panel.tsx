"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import {
  StepCompany,
  StepContact,
  StepCoverage,
  StepCredentials,
  StepFleet,
} from "@/components/partners/register/steps";
import type { ApplicationDraft } from "@/components/partners/register/use-application-draft";
import { PANEL } from "@/components/partners/dashboard/surface";
import { partnerProfileSchema, type PartnerProfile } from "@/lib/partner-profile";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Account settings — the registration form, reopened.
 *
 * Not a form that resembles the one they filled in: literally the same five
 * step components, with the same labels, the same controls and the same
 * validation. A partner who spent six screens getting an account can find
 * every one of those answers here and change it. The alternative — a curated
 * subset of "editable" fields — is how a product ends up with a support
 * queue made entirely of "please update our licence number for us".
 *
 * The wizard's two step-specific pieces are gone, because neither belongs to
 * an account that already exists: the plan has its own flow with its own
 * terms, and the conduct declaration is accepted once rather than re-ticked
 * whenever somebody widens a region list.
 *
 * Changing the email address or the phone number still needs a one-time
 * code. Everything this product sends goes to those two values, so an edit
 * that is wrong silently cuts the account off from its own approvals,
 * document requests and billing notices — and the confirmation makes the
 * change expensive enough to be deliberate, which is what you want of the
 * field an account takeover has to move first.
 */

/**
 * The step components speak `ApplicationDraft`. The stored profile is the
 * same field set minus the two the wizard owns, so the bridge is to add
 * them back with values that keep the steps happy and are never submitted:
 * `declaration` is hidden, and `plan` has no step rendered here.
 */
type Draft = ApplicationDraft & { emailVerified: boolean; phoneVerified: boolean };

const toDraft = (p: PartnerProfile): Draft => ({
  legalName: p.legalName,
  tradingName: p.tradingName ?? "",
  countryIso: p.countryIso,
  city: p.city,
  foundedYear: p.foundedYear,
  website: p.website ?? "",
  size: p.size,

  contactName: p.contactName,
  contactRole: p.contactRole,
  email: p.email,
  phone: p.phone,
  altPhone: p.altPhone ?? "",
  languages: [...p.languages],
  // Seeded true: these are the values the account is already reachable on.
  // Editing either one flips it back — see `update` below.
  emailVerified: true,
  phoneVerified: true,

  registrationNumber: p.registrationNumber,
  vatNumber: p.vatNumber ?? "",
  transportLicence: p.transportLicence,
  cargoCoverEur: p.cargoCoverEur,
  liabilityCoverEur: p.liabilityCoverEur,
  memberships: [...p.memberships],
  registrationDoc: p.registrationDoc ?? null,
  insuranceDoc: p.insuranceDoc ?? null,
  licenceDoc: p.licenceDoc ?? null,

  lorries: p.lorries,
  vans: p.vans,
  ownership: p.ownership,
  weeklyCapacityM3: p.weeklyCapacityM3,
  modes: [...p.modes],
  services: [...p.services],

  regions: [...p.regions],
  availability: p.availability,
  notes: p.notes ?? "",

  // Neither is rendered here; both keep the shared types satisfied.
  declaration: true,
  plan: "",
});

export function SettingsPanel({ profile }: { profile: PartnerProfile }) {
  const { dict, t } = useI18n();
  const st = dict.partnerDashboard.settings;
  const R = dict.register;

  const [saved, setSaved] = useState<PartnerProfile>(profile);
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  /*
   * Reconcile against the API on mount.
   *
   * `profile` is the server render's answer, and on a serverless deployment
   * that render is a different function from the one the save wrote to — so
   * a detail changed on a previous visit would come back as the seeded value
   * and this form would quietly offer to overwrite it.
   */
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const response = await fetch("/api/partners/profile", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { profile: PartnerProfile };
        setSaved(data.profile);
        setDraft(toDraft(data.profile));
      } catch {
        // Keep the server-rendered values; correct on a single-process host.
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  /**
   * Editing a contact route withdraws its confirmation.
   *
   * The one-time-code field pins the value it verified in its own state, and
   * that state does not exist on a fresh mount — so a flag seeded `true`
   * would survive an edit underneath it, which is precisely the badge that
   * vouches for a value nobody confirmed. Recomputing here closes that: the
   * flag is true only while the field still matches what is on file, or
   * while this session has just confirmed the new value.
   */
  const update = useCallback(
    (patch: Partial<Draft>) =>
      setDraft((current) => {
        const next = { ...current, ...patch };
        if ("email" in patch) next.emailVerified = next.email.trim() === saved.email;
        if ("phone" in patch) next.phoneVerified = next.phone.trim() === saved.phone;
        return next;
      }),
    [saved.email, saved.phone],
  );

  const parsed = useMemo(() => partnerProfileSchema.safeParse(draft), [draft]);
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
    if (!parsed.success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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
    setTouched(false);
  };

  const steps = [
    { title: R.s1, lede: R.s1Lede, node: <StepCompany draft={draft} update={update} touched={touched} invalid={invalid} /> },
    { title: R.s2, lede: R.s2Lede, node: <StepContact draft={draft} update={update} touched={touched} invalid={invalid} /> },
    {
      title: R.s3,
      lede: R.s3Lede,
      node: (
        <StepCredentials
          draft={draft}
          update={update}
          touched={touched}
          invalid={invalid}
          documentsOptional
        />
      ),
    },
    { title: R.s4, lede: R.s4Lede, node: <StepFleet draft={draft} update={update} touched={touched} invalid={invalid} /> },
    {
      title: R.s5,
      lede: R.s5Lede,
      node: (
        <StepCoverage
          draft={draft}
          update={update}
          touched={touched}
          invalid={invalid}
          showDeclaration={false}
        />
      ),
    },
  ];

  const contactMoved = !draft.emailVerified || !draft.phoneVerified;

  return (
    <div className="mt-4 lg:mt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] tracking-[-0.03em]">{st.title}</h2>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
            {st.lede}
          </p>
        </div>
        {saved.updatedAt && (
          <p className="text-[12px] text-muted-foreground">
            {t.fill(st.lastSaved, { when: t.dateLong(saved.updatedAt) })}
          </p>
        )}
      </div>

      {touched && invalid.size > 0 && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-3 text-[13px] text-destructive"
        >
          {/* Named when it is the only thing in the way, because "check the
              fields" sends someone hunting for a typo that is not there. */}
          {[...invalid].every((k) => k === "emailVerified" || k === "phoneVerified")
            ? st.verifyFirst
            : st.fixErrors}
        </p>
      )}

      {contactMoved && (
        <p className="mt-4 rounded-xl bg-surface px-3.5 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
          {st.contactChangeNote}
        </p>
      )}

      {/* The five steps, stacked. Same components the application form
          renders one at a time — see the note at the top of this file. */}
      <div className="mt-5 space-y-4">
        {steps.map((step) => (
          <section key={step.title} className={cn(PANEL, "p-6")}>
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {step.title}
            </h3>
            <p className="mt-1.5 text-[15px] font-medium">{step.lede}</p>
            <div className="mt-5">{step.node}</div>
          </section>
        ))}
      </div>

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
