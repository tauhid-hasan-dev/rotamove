"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChartSpline,
  CreditCard,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  Menu,
  Moon,
  Settings,
  Sun,
  Truck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* The admin chrome: sidebar on desktop, sheet menu on mobile, one topbar.
   Uses the same sidebar tokens the rest of the design system defines. */

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: Inbox, exact: false },
  { href: "/admin/companies", label: "Companies", icon: Building2, exact: false },
  { href: "/admin/reports", label: "Sales reports", icon: BarChart3, exact: false },
  { href: "/admin/analytics", label: "Traffic", icon: ChartSpline, exact: false },
  { href: "/admin/billing", label: "Billing", icon: CreditCard, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 rounded-lg outline-ring/40">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-ink">
        <Truck className="size-4.5" aria-hidden />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[17px] font-semibold tracking-[-0.03em]">Rotamove</span>
        <span className="eyebrow !tracking-[0.12em]">Admin</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
              active
                ? "bg-brand/20 text-ink dark:bg-brand/15 dark:text-brand"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className={cn("size-4", active ? "" : "opacity-70")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function DemoBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1.5 border-dashed text-muted-foreground">
          <FlaskConical aria-hidden />
          Demo data
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">
        Every figure here is seeded sample data generated from the product&apos;s own domain
        model. No live analytics or payment providers are connected.
      </TooltipContent>
    </Tooltip>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle colour theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden dark:block" aria-hidden />
      <Moon className="dark:hidden" aria-hidden />
    </Button>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-e border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Wordmark />
        <NavLinks />
        <div className="mt-auto space-y-3">
          <DemoBadge />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Prototype build. Wire to the NestJS API by replacing the seed in{" "}
            <span className="rounded bg-muted px-1 py-px font-medium">lib/admin</span>.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar px-4 py-5">
              <SheetHeader className="p-0 pb-4 text-left">
                <SheetTitle asChild>
                  <div>
                    <Wordmark />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Wordmark />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <DemoBadge />
            </div>
            <ThemeToggle />
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-brand/25 text-xs font-semibold text-ink dark:bg-brand/15 dark:text-brand"
            >
              DA
            </span>
          </div>
        </header>

        <main id="admin-main" className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
