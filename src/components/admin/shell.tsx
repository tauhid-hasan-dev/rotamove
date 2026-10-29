"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChartSpline,
  CreditCard,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Truck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminLocaleSwitcher } from "@/components/admin/locale-switcher";
import { useAdminTitle } from "@/components/admin/page-title";
import { ADMIN_COOKIE, ADMIN_EMAIL } from "@/lib/admin-session";
import { useI18n } from "@/i18n/provider";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

/* The admin chrome: sidebar on desktop, sheet menu on mobile, one topbar.
   Uses the same sidebar tokens the rest of the design system defines. */

const NAV = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", key: "leads", icon: Inbox, exact: false },
  { href: "/admin/companies", key: "companies", icon: Building2, exact: false },
  { href: "/admin/reports", key: "reports", icon: BarChart3, exact: false },
  { href: "/admin/analytics", key: "analytics", icon: ChartSpline, exact: false },
  { href: "/admin/billing", key: "billing", icon: CreditCard, exact: false },
  { href: "/admin/settings", key: "settings", icon: Settings, exact: false },
] as const satisfies ReadonlyArray<{
  href: string;
  key: keyof Dictionary["admin"]["shell"]["nav"];
  icon: typeof Inbox;
  exact: boolean;
}>;

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
  const { dict } = useI18n();
  return (
    <nav aria-label={dict.admin.shell.navAria} className="flex flex-col gap-1">
      {NAV.map(({ href, key, icon: Icon, exact }) => {
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
            {dict.admin.shell.nav[key]}
          </Link>
        );
      })}
    </nav>
  );
}

function DemoBadge() {
  const { dict } = useI18n();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1.5 border-dashed text-muted-foreground">
          <FlaskConical aria-hidden />
          {dict.admin.shell.demoData}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">{dict.admin.shell.demoTooltip}</TooltipContent>
    </Tooltip>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { dict } = useI18n();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={dict.common.toggleTheme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden dark:block" aria-hidden />
      <Moon className="dark:hidden" aria-hidden />
    </Button>
  );
}

function AccountMenu() {
  const { dict, href } = useI18n();
  const router = useRouter();

  const signOut = () => {
    document.cookie = `${ADMIN_COOKIE}=; path=/; max-age=0; samesite=lax`;
    // Out of the console entirely, not back to its sign-in screen. Refreshing
    // in place left the operator looking at a login form on /admin/billing,
    // which reads as "your session broke" rather than "you signed out".
    router.push(href("/"));
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={dict.admin.auth.account}
        className="flex size-8 items-center justify-center rounded-full bg-brand/25 text-xs font-semibold text-ink outline-ring/40 transition-opacity hover:opacity-90 dark:bg-brand/15 dark:text-brand"
      >
        DA
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-[13px] font-medium">{dict.admin.auth.demoAdmin}</span>
          <span className="block text-xs text-muted-foreground">{ADMIN_EMAIL}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="gap-2">
          <LogOut aria-hidden className="rtl:-scale-x-100" />
          {dict.admin.auth.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PageTitle() {
  const title = useAdminTitle();
  if (!title) return null;
  return (
    <h1 className="hidden min-w-0 truncate text-[15px] font-semibold tracking-[-0.02em] lg:block">
      {title}
    </h1>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { dict } = useI18n();

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-e border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Wordmark />
        <NavLinks />
        <div className="mt-auto space-y-3">
          <DemoBadge />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {dict.admin.shell.prototypeNote}{" "}
            <span className="rounded bg-muted px-1 py-px font-medium">lib/admin</span>.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={dict.admin.shell.openNav}
              >
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

          {/* Claimed by the view, not derived from the route — see
              `page-title.ts`. Hidden on phones, where the wordmark already
              owns the row. */}
          <PageTitle />

          <div className="ms-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <DemoBadge />
            </div>
            <AdminLocaleSwitcher />
            <ThemeToggle />
            <AccountMenu />
          </div>
        </header>

        <main id="admin-main" className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
