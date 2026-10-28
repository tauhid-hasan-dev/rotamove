"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  adminCredentialsMatch,
} from "@/lib/admin-session";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Admin sign-in.
 *
 * Rendered by the admin layout in place of the console whenever the session
 * cookie is missing, so every `/admin/*` URL is gated by the same check and
 * none of them can be reached by typing the path. Credentials are on the
 * form on purpose — same reasoning as the partner login.
 */
export function AdminLoginForm() {
  const { dict, href } = useI18n();
  const ax = dict.admin.auth;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCredentialsMatch(email, password)) {
      setFailed(true);
      return;
    }
    setFailed(false);
    setSubmitting(true);
    document.cookie = `${ADMIN_COOKIE}=1; path=/; max-age=${ADMIN_COOKIE_MAX_AGE}; samesite=lax`;
    // The layout is force-dynamic, so a refresh re-runs the gate and swaps
    // this form for the console.
    startTransition(() => router.refresh());
  };

  const busy = submitting || pending;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md">
        <div className="rounded-3xl border bg-card p-7 shadow-soft sm:p-8">
          <span className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-ink">
              <Truck className="size-5" aria-hidden />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-semibold tracking-[-0.03em]">Rotamove</span>
              <span className="eyebrow !tracking-[0.12em]">Admin</span>
            </span>
          </span>

          <h1 className="mt-6 text-[clamp(1.5rem,3vw,1.9rem)] leading-[1.1] tracking-[-0.035em]">
            {ax.title}
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">{ax.lede}</p>

          <div className="mt-7 space-y-4">
            <div>
              <Label htmlFor="admin-email" className="mb-2 block text-[13.5px]">
                {ax.email}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFailed(false);
                  }}
                  placeholder={ADMIN_EMAIL}
                  className={cn("h-12 rounded-2xl ps-11", failed && "border-destructive")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-password" className="mb-2 block text-[13.5px]">
                {ax.password}
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-password"
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
              {ax.error}
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
                {ax.signingIn}
              </>
            ) : (
              <>
                {ax.submit}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100" />
              </>
            )}
          </button>

          <div className="mt-6 rounded-2xl border border-dashed bg-surface p-4">
            <p className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {ax.demoTitle}
            </p>
            <dl className="mt-2.5 space-y-1 text-[13px]">
              <div className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">{ax.email}</dt>
                <dd className="tnum font-medium">{ADMIN_EMAIL}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-muted-foreground">{ax.password}</dt>
                <dd className="tnum font-medium">{ADMIN_PASSWORD}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                setEmail(ADMIN_EMAIL);
                setPassword(ADMIN_PASSWORD);
                setFailed(false);
              }}
              className="mt-3 text-[13px] underline decoration-brand decoration-2 underline-offset-4 transition-colors hover:text-muted-foreground"
            >
              {ax.demoFill}
            </button>
          </div>
        </div>

        {/* A way out. Without it the only exit from a gated /admin URL is the
            browser's back button, and anyone who arrived here by typing the
            path has nowhere to go. */}
        <Link
          href={href("/")}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden />
          {ax.backToSite}
        </Link>
      </form>
    </main>
  );
}
