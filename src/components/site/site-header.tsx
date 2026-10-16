"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/coverage", label: "Coverage" },
  { href: "/partners", label: "For movers" },
];

export function SiteHeader({ variant = "default" }: { variant?: "default" | "flush" }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-300",
        scrolled || variant === "flush"
          ? "border-b bg-background/88 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[14.5px] transition-colors hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden rounded-full sm:inline-flex" />
          <Link
            href="/partners/dashboard"
            className="hidden rounded-full px-4 py-2 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
          >
            Partner login
          </Link>
          <Link
            href="/"
            className="hidden rounded-full bg-brand px-5 py-2.5 text-[14.5px] font-medium text-ink transition-all duration-200 hover:brightness-[0.97] active:scale-[0.985] sm:inline-flex"
          >
            Start a search
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-4" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-3 text-[16px] transition-colors hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/partners/dashboard"
                  className="rounded-xl px-3 py-3 text-[16px] transition-colors hover:bg-muted"
                >
                  Partner login
                </Link>
              </nav>
              <div className="mt-auto flex flex-col gap-3 p-4">
                <Link
                  href="/"
                  className="rounded-full bg-brand py-3 text-center text-[15.5px] font-medium text-ink"
                >
                  Start a search
                </Link>
                <div className="flex items-center justify-between rounded-xl border px-4 py-2">
                  <span className="text-[14px] text-muted-foreground">Appearance</span>
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
