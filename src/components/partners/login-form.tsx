"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  PARTNER_COOKIE,
  PARTNER_COOKIE_MAX_AGE,
  credentialsMatch,
} from "@/lib/partner-session";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Partner sign-in.
 *
 * The demo credentials are printed on the form on purpose — a login nobody can
 * get past is a dead end, not a security feature. One click fills them in.
 */
export function LoginForm() {
  const { dict, href } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsMatch(email, password)) {
      setFailed(true);
      return;
    }
    setFailed(false);
    setSubmitting(true);
    // Same pattern as the locale cookie: written before navigating, because
    // the dashboard checks it server-side on the very next request.
    document.cookie = `${PARTNER_COOKIE}=1; path=/; max-age=${PARTNER_COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(() => router.push(href("/partners/dashboard")));
  };

  const busy = submitting || pending;

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="rounded-3xl border bg-card p-7 shadow-soft sm:p-8">
        <span className="grid size-11 place-items-center rounded-full bg-brand text-ink">
          <KeyRound className="size-[18px]" strokeWidth={2} />
        </span>

        <h1 className="mt-6 text-[clamp(1.6rem,3vw,2.1rem)] leading-[1.08] tracking-[-0.035em]">
          {dict.login.title}
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
          {dict.login.lede}
        </p>

        <div className="mt-7 space-y-4">
          <div>
            <Label htmlFor="partner-email" className="mb-2 block text-[13.5px]">
              {dict.login.email}
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="partner-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFailed(false);
                }}
                placeholder={DEMO_EMAIL}
                className={cn("h-12 rounded-2xl ps-11", failed && "border-destructive")}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="partner-password" className="mb-2 block text-[13.5px]">
              {dict.login.password}
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="partner-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFailed(false);
                }}
                placeholder="••••••••"
                className={cn("h-12 rounded-2xl ps-11", failed && "border-destructive")}
              />
            </div>
          </div>
        </div>

        {failed && (
          <p role="alert" className="mt-3 text-[13px] text-destructive">
            {dict.login.error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-[15.5px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985] disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {dict.login.signingIn}
            </>
          ) : (
            <>
              {dict.login.submit}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
            </>
          )}
        </button>

        {/* The credentials, in plain sight. */}
        <div className="mt-6 rounded-2xl border border-dashed bg-surface p-4">
          <p className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {dict.login.demoTitle}
          </p>
          <dl className="mt-2.5 space-y-1 text-[13px]">
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">{dict.login.email}</dt>
              <dd className="font-medium tnum">{DEMO_EMAIL}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">{dict.login.password}</dt>
              <dd className="font-medium tnum">{DEMO_PASSWORD}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setFailed(false);
            }}
            className="mt-3 text-[13px] underline underline-offset-4 decoration-brand decoration-2 transition-colors hover:text-muted-foreground"
          >
            {dict.login.demoFill}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            {dict.login.demoBody}
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-[13.5px] text-muted-foreground">
        {dict.login.notPartner}{" "}
        <Link
          href={href("/partners/register")}
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          {dict.register.title}
        </Link>
      </p>
    </form>
  );
}
