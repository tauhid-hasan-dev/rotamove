"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Loader2, TriangleAlert } from "lucide-react";
import { PhoneField } from "@/components/common/phone-field";
import { TurnstileWidget, type TurnstileState } from "@/components/contact/turnstile-widget";
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
  const [challenge, setChallenge] = useState<TurnstileState>("loading");
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
      <div className="rounded-3xl border border-verify/30 bg-verify/5 p-8 text-center sm:p-12">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-verify/15">
          <Check className="size-5 text-verify" strokeWidth={3} aria-hidden />
        </span>
        <h2 className="mt-5 text-[22px] tracking-[-0.03em]">{cx.sentTitle}</h2>
        <p className="mx-auto mt-2.5 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
          {t.fill(cx.sentBody, { email: values.email })}
        </p>
        {receipt && (
          <p className="mt-4 text-[12.5px] text-muted-foreground">
            {cx.reference}{" "}
            <span className="code text-foreground">{receipt}</span>
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
      className="rounded-3xl border bg-surface p-4 sm:p-6 md:p-8"
    >
      {/* Declared single column at the base rather than implicit: an auto
          track sizes to its items' min-content, and a select trigger plus a
          dialling-code button is wider than a 320px phone has to give. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          id="fullName"
          label={cx.fullName}
          error={touched && invalid.has("fullName") ? cx.errFullName : null}
        >
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder={cx.fullNamePlaceholder}
            autoComplete="name"
            className={cn(
              "h-12 rounded-2xl",
              touched && invalid.has("fullName") && "border-destructive",
            )}
          />
        </Field>

        <Field
          id="email"
          label={cx.email}
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
              "h-12 rounded-2xl",
              touched && invalid.has("email") && "border-destructive",
            )}
          />
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
          />
        </Field>

        <Field
          id="topic"
          label={cx.topic}
          error={touched && invalid.has("topic") ? cx.errTopic : null}
        >
          <Select
            value={values.topic}
            onValueChange={(v) => set("topic", v as Values["topic"])}
          >
            <SelectTrigger
              id="topic"
              className={cn(
                "h-12 w-full rounded-2xl",
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
          id="message"
          label={cx.message}
          className="sm:col-span-2"
          error={touched && invalid.has("message") ? cx.errMessage : null}
        >
          <Textarea
            id="message"
            value={values.message}
            onChange={(e) => set("message", e.target.value.slice(0, MESSAGE_MAX))}
            placeholder={cx.messagePlaceholder}
            rows={6}
            className={cn(
              "min-h-[150px] rounded-2xl",
              touched && invalid.has("message") && "border-destructive",
            )}
          />
          <p className="mt-1.5 text-end text-[12px] text-muted-foreground tnum">
            {t.fill(cx.messageCount, {
              n: t.number(values.message.length),
              max: t.number(MESSAGE_MAX),
            })}
          </p>
        </Field>
      </div>

      {/* verification ------------------------------------------- */}
      <div className="mt-7 border-t pt-6">
        <p className="text-[13.5px] font-medium">{cx.verifyTitle}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {cx.verifyBody}
        </p>

        <TurnstileWidget
          siteKey={siteKey}
          onToken={setToken}
          onStateChange={setChallenge}
          className="mt-3"
        />

        {/* Said plainly rather than left for someone to discover. A widget
            that always passes looks exactly like one that works. */}
        {testKeys && (
          <p className="mt-2 inline-flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
            <TriangleAlert className="mt-px size-3.5 shrink-0 text-lastcall-icon" aria-hidden />
            {cx.verifyTestKeys}
          </p>
        )}
      </div>

      {failure && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-[13px] leading-relaxed text-destructive"
        >
          {failure}
        </p>
      )}

      {touched && invalid.size > 0 && (
        <p className="mt-5 text-[13px] text-destructive">{cx.fixErrors}</p>
      )}

      {/* Stacked on a phone. Side by side, the note was squeezed into a
          third of the row and ran to six lines beside a button with room to
          spare — `flex-wrap` only wraps when an item asks for more width
          than is left, and a paragraph never does. */}
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="min-w-0 text-[12.5px] leading-relaxed text-muted-foreground sm:flex-1">
          {cx.privacyNote}
        </p>

        <button
          type="submit"
          disabled={status === "sending"}
          aria-disabled={!canSubmit}
          className={cn(
            "group inline-flex w-full min-w-[170px] items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 sm:w-auto",
            "text-[15.5px] font-medium text-ink transition-all duration-200",
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

      {/* Why the button is dim, when it is dim for a reason the fields do
          not already show. */}
      {challenge !== "solved" && touched && invalid.size === 0 && (
        <p className="mt-3 text-end text-[12.5px] text-muted-foreground">{cx.awaitingVerify}</p>
      )}
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-[13.5px]">
          {label}
        </Label>
        {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-[12.5px] text-destructive">{error}</p>}
    </div>
  );
}
