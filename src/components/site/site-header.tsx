"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlarmClock, Menu } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { useLastCall } from "@/components/site/use-last-call";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PAGE_GUTTER } from "@/components/common/section";
import { useI18n } from "@/i18n/provider";
import { stripLocale } from "@/i18n/paths";
import { cn } from "@/lib/utils";

/**
 * The last-call entry in the navigation.
 *
 * Deliberately not a plain link like its neighbours: it points at stock
 * that disappears within hours, so it carries the accent colour, a clock
 * and a live count. The pulse is one slow ring rather than a blink —
 * enough to catch the eye on arrival without becoming scenery you have to
 * ignore for the rest of the session.
 */
function LastCallNavLink({
  href: target,
  label,
  count,
  mobile = false,
}: {
  href: string;
  label: string;
  count: number;
  mobile?: boolean;
}) {
  return (
    <Link
      href={target}
      className={cn(
        "group relative inline-flex items-center gap-2 font-medium transition-all duration-200",
        "bg-lastcall text-lastcall-foreground hover:brightness-[0.97]",
        mobile
          ? "rounded-xl px-3 py-3 text-[16px]"
          : "rounded-full px-3.5 py-1.5 text-[14px]",
      )}
    >
      <span className="relative grid size-4 place-items-center">
        {/* The clock rings rather than sitting still. This button is the one
            thing on the page advertising stock that expires in hours, and
            motion is what earns a glance for it. */}
        <AlarmClock
          className="last-call-ring relative size-4 motion-reduce:animate-none"
          strokeWidth={2.2}
        />
        {count > 0 && (
          <span
            aria-hidden
            className="last-call-ping absolute inset-0 rounded-full bg-lastcall-accent"
          />
        )}
      </span>
      {label}
      {count > 0 && (
        <span className="rounded-full bg-lastcall-accent px-1.5 py-0.5 text-[10.5px] font-semibold text-ink tnum">
          {count}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader({ variant = "default" }: { variant?: "default" | "flush" }) {
  const { dict, href, rtl } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { offers } = useLastCall();

  const nav = [
    { path: "/how-it-works", label: dict.nav.howItWorks },
    { path: "/coverage", label: dict.nav.coverage },
    { path: "/partners", label: dict.nav.forMovers },
  ];

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Compared without the locale prefix, so /de/coverage highlights Coverage
  // exactly as /coverage does.
  const current = stripLocale(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        scrolled || variant === "flush"
          ? "border-b bg-background/88 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className={cn(PAGE_GUTTER, "flex h-16 items-center gap-8")}>
        <Logo />

        <nav className="hidden items-center gap-7 md:flex" aria-label={dict.nav.main}>
          {nav.map((item) => {
            const active = current.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={href(item.path)}
                className={cn(
                  "text-[14.5px] transition-colors hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <LastCallNavLink
            href={href("/last-call")}
            label={dict.nav.lastCall}
            count={offers.length}
          />
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle className="hidden rounded-full sm:inline-flex" />
          <Link
            href={href("/partners/login")}
            className="hidden rounded-full px-4 py-2 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
          >
            {dict.common.partnerLogin}
          </Link>
          <Link
            href={href("/")}
            className="ms-1 hidden rounded-full bg-brand px-5 py-2.5 text-[14.5px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985] sm:inline-flex"
          >
            {dict.common.startSearch}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted md:hidden"
                aria-label={dict.common.openMenu}
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            {/* Opens from the leading edge, which is the right-hand side in
                Arabic — a drawer sliding in from the "back" of the page reads
                as a mistake. */}
            <SheetContent side={rtl ? "left" : "right"} className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-start">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4" aria-label={dict.nav.mobile}>
                {nav.map((item) => (
                  <Link
                    key={item.path}
                    href={href(item.path)}
                    className="rounded-xl px-3 py-3 text-[16px] transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <LastCallNavLink
                  href={href("/last-call")}
                  label={dict.nav.lastCall}
                  count={offers.length}
                  mobile
                />
                <Link
                  href={href("/partners/login")}
                  className="rounded-xl px-3 py-3 text-[16px] transition-colors hover:bg-muted"
                >
                  {dict.common.partnerLogin}
                </Link>
              </nav>
              <div className="mt-auto flex flex-col gap-3 p-4">
                <Link
                  href={href("/")}
                  className="rounded-full bg-brand py-3 text-center text-[15.5px] font-medium text-ink"
                >
                  {dict.common.startSearch}
                </Link>
                <div className="flex items-center justify-between rounded-xl border px-2 py-1.5">
                  <span className="ps-2 text-[14px] text-muted-foreground">
                    {dict.language.label}
                  </span>
                  <LanguageSwitcher align="end" />
                </div>
                <div className="flex items-center justify-between rounded-xl border px-4 py-2">
                  <span className="text-[14px] text-muted-foreground">
                    {dict.common.appearance}
                  </span>
                  <ThemeToggle className="rounded-full" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
