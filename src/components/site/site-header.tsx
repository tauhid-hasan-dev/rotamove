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
      aria-label={label}
      className={cn(
        "group relative inline-flex items-center gap-2 whitespace-nowrap font-medium transition-all duration-200",
        "bg-lastcall text-lastcall-foreground hover:brightness-[0.97]",
        mobile
          ? "rounded-xl px-3 py-3 text-[16px]"
          : "rounded-full px-2.5 py-1.5 text-[14px] 2xl:px-3.5",
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
      {/* The word goes when the bar is tight, the clock and the count stay.
          Dropping the label rather than the whole pill keeps the one item
          advertising expiring stock on screen at every desktop width; the
          clock carries the meaning and the count carries the urgency.
          `aria-label` on the link is what names it either way, so the pill
          reads the same to a screen reader whether the word is painted. */}
      <span className={cn(mobile ? "inline" : "hidden xl:inline")}>{label}</span>
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

  /*
   * The left group is for people with something to move. "Become a partner"
   * used to sit here as "For carriers" and it was the odd one out: everything
   * beside it answers a question a shipper is already asking, while that one
   * addresses the other side of the marketplace entirely. It lives on the
   * right now, next to partner login, where the two carrier-facing doors are
   * together and neither interrupts the shipper's row.
   */
  const nav = [
    { path: "/how-it-works", label: dict.nav.howItWorks },
    { path: "/coverage", label: dict.nav.coverage },
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
      {/*
        The bar is sized to the longest translation, not to English.

        It used to show the full desktop navigation from `md` and let flexbox
        sort out the overflow, which it did by breaking every label across two
        or three lines: "How it works" became a three-line stack at 768px, and
        French and Russian were still wrapping at 1440. Nothing here wraps now
        — every label is `nowrap`, so the bar either has room for an item or
        does not show it at all — and the breakpoints below were measured
        against all eight locales rather than guessed.

        What appears when:
          < lg    the drawer. Three links, a pill and two controls do not fit
                  in the 722px a tablet leaves inside the gutter.
          lg      links + the last-call pill, compact; language and theme.
          xl      the last-call pill gets its word back.
          2xl     partner login joins the row, and the gaps open up.

        This used to switch at a bespoke 1120px, because the bar also carried
        a "start a search" button and in French that pushed it to 874px of
        the 819px a 1024px screen allows. The button is gone — it pointed at
        the home page, which is what the logo beside it already does — and
        with it the reason for a breakpoint of our own. The widest
        translation now clears `lg` with 150px to spare.
      */}
      <div className={cn(PAGE_GUTTER, "flex h-16 items-center gap-4 2xl:gap-6")}>
        <Logo />

        <nav
          className="hidden items-center gap-4 lg:flex 2xl:gap-6"
          aria-label={dict.nav.main}
        >
          {nav.map((item) => {
            const active = current.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={href(item.path)}
                className={cn(
                  "whitespace-nowrap text-[14px] transition-colors hover:text-foreground 2xl:text-[14.5px]",
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
          {/* Last in, first out: partner login is the only item here that is
              also one tap away inside the dashboard, so it is the one the bar
              can afford to hold back until there is genuinely room. It waited
              until `2xl` while the bar still carried a call to action; with
              that gone there is room for it from `xl`, and the right-hand
              side of a 1280px header is otherwise two icons and a gap. */}
          <Link
            href={href("/partners/login")}
            className="hidden whitespace-nowrap rounded-full px-4 py-2 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:inline-flex"
          >
            {dict.common.partnerLogin}
          </Link>

          {/* Last, and the only item on this side carrying full-strength ink:
              it is the one thing in the bar asking someone to join rather
              than to look. It appears whenever the desktop row does, while
              partner login waits for `xl` — a carrier who has not signed up
              yet needs the door more than one who has. */}
          <Link
            href={href("/partners")}
            className={cn(
              "hidden whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-colors lg:inline-flex",
              // The join funnel only. `/partners/login` and the dashboard
              // behind it belong to someone who has already joined, and
              // lighting this up there would be telling them to do it again.
              current === "/partners" || current.startsWith("/partners/register")
                ? "text-foreground"
                : "text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            {dict.nav.becomePartner}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted lg:hidden"
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
                {/* The drawer carries both carrier doors explicitly, because
                    it no longer gets "Become a partner" from the `nav` array
                    the way it used to. The bar can move an item to its right
                    edge; the drawer has no right edge, so the only thing that
                    changes here is the order. */}
                <Link
                  href={href("/partners")}
                  className="rounded-xl px-3 py-3 text-[16px] font-medium transition-colors hover:bg-muted"
                >
                  {dict.nav.becomePartner}
                </Link>
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
