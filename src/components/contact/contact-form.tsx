"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, TriangleAlert } from "lucide-react";
import { PhoneField } from "@/components/common/phone-field";
import { TurnstileWidget } from "@/components/contact/turnstile-widget";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_TOPICS, MESSAGE_MAX, contactFieldsSchema } from "@/lib/contact-schema";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type Values = {
  fullName: string;
  email: string;
  phone: string;
  topic: (typeof CONTACT_TOPICS)[number] | "";
  message: string;
};

const EMPTY: Values = { fullName: "", email: "", phone: "", topic: "", message: "" };

type Status = "idle" | "sending" | "sent" | "failed";

/**
 * The form half of the contact page.
 *
 * A card on the page's tinted band rather than a bare column of fields:
 * the band carries the heading and the contact details, and the card is
 * the thing you fill in. Two fields to a row from `sm` up, which is what
 * keeps five fields and a message box to one screen on a laptop.
 */
export function ContactForm({
  siteKey,
  /** True while Cloudflare's always-passes test keys are in force. */
  testKeys,
}: {
  siteKey: string;
  testKeys: boolean;
}) {
  const { dict, t, locale } = useI18n();
  const cx = dict.contactPage;

  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  /*
   * The same schema the route runs, minus the token the widget owns. Field
   * errors are derived rather than stored, so there is no second copy of
   * "is this valid" to drift out of step with the first.
   */
  const invalid = useMemo(() => {
    const result = contactFieldsSchema.safeParse({ ...values, locale });
    if (result.success) return new Set<string>();
    return new Set(result.error.issues.map((i) => String(i.path[0])));
  }, [values, locale]);

  const canSubmit = invalid.size === 0 && !!token && status !== "sending";

  const submit = async () => {
    if (invalid.size > 0 || !token) return setTouched(true);

    setStatus("sending");
    setFailure(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, locale, turnstileToken: token }),
      });

      if (!response.ok) {
        // The challenge token is spent either way, so the widget resets and
        // the visitor solves one fresh box rather than re-filling the form.
        setToken(null);
        window.turnstile?.reset();
        setStatus("failed");
        setFailure(response.status === 503 ? cx.errorUnavailable : cx.errorRejected);
        return;
      }

      const data = (await response.json()) as { id: string };
      setReceipt(data.id);
      setStatus("sent");
    } catch {
      setToken(null);
      window.turnstile?.reset();
      setStatus("failed");
      setFailure(cx.errorNetwork);
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-3xl border bg-card p-8 text-center shadow-soft sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-verify/15">
          <Check className="size-5 text-verify" strokeWidth={3} aria-hidden />
        </span>
        <h2 className="mt-5 text-[22px] tracking-[-0.03em]">{cx.sentTitle}</h2>
        <p className="mx-auto mt-2.5 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
          {t.fill(cx.sentBody, { email: values.email })}
        </p>
        {receipt && (
          <p className="mt-4 text-[12.5px] text-muted-foreground">
            {cx.reference} <span className="code text-foreground">{receipt}</span>
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setTouched(false);
            setToken(null);
            setReceipt(null);
            setStatus("idle");
          }}
          className="mt-7 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-medium transition-colors hover:border-foreground/25 hover:bg-muted"
        >
          {cx.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="rounded-3xl border bg-card p-5 shadow-soft sm:p-7 lg:p-8"
    >
      {/* The second column is a shade wider than the first, which is there
          for the phone row: the dialling picker takes a fixed ~95px off
          whichever cell it lands in, and at an even split that left the
          number itself too narrow to show a full one. Name and email on
          the row above absorb the asymmetry invisibly. */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)]">
        <Field
          id="fullName"
          label={cx.fullName}
          required
          error={touched && invalid.has("fullName") ? cx.errFullName : null}
        >
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder={cx.fullNamePlaceholder}
            autoComplete="name"
            className={cn(
              "h-11 rounded-xl",
              touched && invalid.has("fullName") && "border-destructive",
            )}
          />
        </Field>

        <Field
          id="email"
          label={cx.email}
          required
          error={touched && invalid.has("email") ? cx.errEmail : null}
        >
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder={cx.emailPlaceholder}
            autoComplete="email"
            className={cn(
              "h-11 rounded-xl",
              touched && invalid.has("email") && "border-destructive",
            )}
          />
        </Field>

        <Field
          id="topic"
          label={cx.topic}
          required
          error={touched && invalid.has("topic") ? cx.errTopic : null}
        >
          <Select value={values.topic} onValueChange={(v) => set("topic", v as Values["topic"])}>
            <SelectTrigger
              id="topic"
              className={cn(
                "h-11 w-full rounded-xl",
                touched && invalid.has("topic") && "border-destructive",
              )}
            >
              <SelectValue placeholder={cx.topicPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TOPICS.map((id) => (
                <SelectItem key={id} value={id}>
                  {cx.topics[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          id="phone"
          label={cx.phone}
          hint={cx.phoneOptional}
          error={touched && invalid.has("phone") ? cx.errPhone : null}
        >
          <PhoneField
            id="phone"
            value={values.phone}
            onChange={(phone) => set("phone", phone)}
            invalid={touched && invalid.has("phone")}
            inputClassName="h-11"
            className="[&>button]:h-11"
          />
        </Field>

        <Field
          id="message"
          label={cx.message}
          required
          className="sm:col-span-2"
          error={touched && invalid.has("message") ? cx.errMessage : null}
        >
          <Textarea
            id="message"
            value={values.message}
            onChange={(e) => set("message", e.target.value.slice(0, MESSAGE_MAX))}
            placeholder={cx.messagePlaceholder}
            rows={5}
            className={cn(
              "min-h-[130px] rounded-xl",
              touched && invalid.has("message") && "border-destructive",
            )}
          />
          <p className="mt-1.5 text-end text-[11.5px] text-muted-foreground tnum">
            {t.fill(cx.messageCount, {
              n: t.number(values.message.length),
              max: t.number(MESSAGE_MAX),
            })}
          </p>
        </Field>
      </div>

      {/* The challenge renders here only if the key is configured to show
          one. A managed key usually resolves silently, which is why the
          line below says it ran rather than a box announcing itself. */}
      <TurnstileWidget siteKey={siteKey} onToken={setToken} className="mt-2 empty:mt-0" />

      {failure && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-[13px] leading-relaxed text-destructive"
        >
          {failure}
        </p>
      )}

      {touched && invalid.size > 0 && (
        <p className="mt-5 text-[13px] text-destructive">{cx.fixErrors}</p>
      )}

      {/* Said plainly rather than left for someone to discover. A widget
          that always passes looks exactly like one that works. */}
      {testKeys && (
        <p className="mt-5 inline-flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
          <TriangleAlert className="mt-px size-3.5 shrink-0 text-lastcall-icon" aria-hidden />
          {cx.verifyTestKeys}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-[11.5px] leading-relaxed text-muted-foreground sm:flex-1">
          <LegalLine />
        </p>

        <button
          type="submit"
          disabled={status === "sending"}
          aria-disabled={!canSubmit}
          className={cn(
            "group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-8 py-3",
            "text-[15px] font-medium text-ink transition-all duration-200 sm:w-auto",
            "hover:brightness-[0.97] active:scale-[0.985] disabled:opacity-70",
            !canSubmit && "opacity-60",
          )}
        >
          {status === "sending" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {cx.sending}
            </>
          ) : (
            <>
              {cx.submit}
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100"
                aria-hidden
              />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/**
 * "Protected by Cloudflare Turnstile. See our Privacy policy and Terms."
 *
 * Split on the placeholders rather than assembled from three fragments,
 * because word order is not a constant: German puts the verb last and
 * Arabic runs the other way, and a sentence glued together in English
 * order would be wrong in both. One translatable string with two slots
 * lets each locale put the links where its own grammar wants them.
 */
function LegalLine() {
  const { dict, href } = useI18n();
  const parts = dict.contactPage.protectedBy.split(/(\{privacy\}|\{terms\})/);

  return (
    <>
      {parts.map((part, i) => {
        if (part !== "{privacy}" && part !== "{terms}") return <span key={i}>{part}</span>;
        const privacy = part === "{privacy}";
        return (
          <Link
            key={i}
            href={href(privacy ? "/privacy" : "/terms")}
            className="underline underline-offset-2 transition-colors hover:text-foreground"
          >
            {privacy ? dict.legal.privacyTitle : dict.legal.termsTitle}
          </Link>
        );
      })}
    </>
  );
}

/**
 * Label, control, error.
 *
 * The asterisk is decorative — `aria-hidden`, with the real signal being
 * the word in the label's `title`. A screen reader announcing "star" on
 * every other field is noise, and the schema is what actually enforces it.
 */
function Field({
  id,
  label,
  hint,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-[13px] font-medium">
          {label}
          {required && (
            <span className="ms-0.5 text-destructive" aria-hidden>
              *
            </span>
          )}
        </Label>
        {hint && <span className="text-[11.5px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
