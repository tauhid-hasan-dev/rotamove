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

type NavKey = keyof Dictionary["admin"]["shell"]["nav"];

interface NavItem {
  href: string;
  key: NavKey;
  icon: typeof Inbox;
  exact: boolean;
  /** Rendered indented beneath the parent when the parent section is open. */
  children?: ReadonlyArray<{ href: string; key: NavKey; exact: boolean }>;
}

const NAV = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", key: "leads", icon: Inbox, exact: false },
  {
    href: "/admin/companies",
    key: "companies",
    icon: Building2,
    exact: false,
    children: [
      /*
       * `/admin/companies/pending` is a static segment sitting beside the
       * `[id]` route for company detail. Next resolves static before dynamic,
       * so this wins — and no mover id is ever the literal string "pending",
       * so nothing is shadowed.
       */
      { href: "/admin/companies/pending", key: "companiesPending", exact: true },
      // Exact, so it stops being highlighted once you are on the pending tab
      // or inside a company — otherwise both parent entries light up at once.
      { href: "/admin/companies", key: "companiesManage", exact: true },
    ],
  },
  { href: "/admin/reports", key: "reports", icon: BarChart3, exact: false },
  { href: "/admin/analytics", key: "analytics", icon: ChartSpline, exact: false },
  { href: "/admin/billing", key: "billing", icon: CreditCard, exact: false },
  { href: "/admin/settings", key: "settings", icon: Settings, exact: false },
] as const satisfies ReadonlyArray<NavItem>;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The console's mark.
 *
 * `compact` drops the "Admin" tag. The topbar uses it on phones: with the
 * tag, the mark ran to 171px of a 350px bar and pushed the account menu off
 * the right-hand edge entirely — there was no way to sign out on a phone.
 * The sidebar and the sheet, which have a column to themselves, keep it.
 */
function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-ring/40">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-ink">
        <Truck className="size-4.5" aria-hidden />
      </span>
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="truncate text-[17px] font-semibold tracking-[-0.03em]">Rotamove</span>
        {!compact && <span className="eyebrow !tracking-[0.12em]">Admin</span>}
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { dict } = useI18n();
  return (
    <nav aria-label={dict.admin.shell.navAria} className="flex flex-col gap-1">
      {NAV.map((item) => {
        const { href, key, icon: Icon, exact } = item;
        const children = "children" in item ? item.children : undefined;
        // The parent highlights for anything in its subtree, so Companies
        // stays lit while you are on Pending or inside a company record.
        const inSection = isActive(pathname, href, exact);

        return (
          <div key={href} className="contents">
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={inSection && !children ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                inSection
                  ? "bg-brand/20 text-ink dark:bg-brand/15 dark:text-brand"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("size-4", inSection ? "" : "opacity-70")} aria-hidden />
              {dict.admin.shell.nav[key]}
            </Link>

            {/* Sub-items, shown only while their section is open. Always
                visible would put two more rows in a seven-item sidebar for
                the benefit of whoever is not currently in that section. */}
            {children && inSection && (
              <div className="relative mb-1 ms-[1.6rem] flex flex-col gap-0.5 ps-3.5">
                {/* The spine: one rule the whole group hangs off, which is
                    what makes two indented links read as belonging to the
                    entry above rather than as two more top-level items. */}
                <span
                  aria-hidden
                  className="absolute inset-y-1 start-0 w-px bg-sidebar-border"
                />
                {children.map((child) => {
                  const active = isActive(pathname, child.href, child.exact);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {dict.admin.shell.nav[child.key]}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
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

          <div className="min-w-0 lg:hidden">
            <Wordmark compact />
          </div>

          {/* Claimed by the view, not derived from the route — see
              `page-title.ts`. Hidden on phones, where the wordmark already
              owns the row. */}
          <PageTitle />

          <div className="ms-auto flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <DemoBadge />
            </div>
            <AdminLocaleSwitcher />
            <ThemeToggle />
            <AccountMenu />
          </div>
        </header>

        {/* The cap rises on the two screen sizes a console is actually
            operated on all day. 1480px is a comfortable 15" measure and a
            waste of a 27" panel, where the same cap left a quarter of the
            glass empty while the lead table still scrolled sideways. */}
        <main
          id="admin-main"
          className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8 3xl:max-w-[1760px] 4xl:max-w-[2120px]"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
