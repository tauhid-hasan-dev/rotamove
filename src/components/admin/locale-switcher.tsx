"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Globe, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_META } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { rememberLocale } from "@/i18n/cookie";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Language switcher for the admin console.
 *
 * Admin URLs carry no locale segment — the layout reads the same
 * `rotamove.locale` cookie the public site writes — so switching here is
 * "write the cookie, re-render": `router.refresh()` re-runs the force-dynamic
 * layout with the new dictionary. One cookie, one preference, every surface.
 */
export function AdminLocaleSwitcher({ className }: { className?: string }) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const select = (next: Locale) => {
    if (next === locale) return;
    rememberLocale(next);
    startTransition(() => router.refresh());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={dict.language.choose}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Globe className="size-4" strokeWidth={2} />
        )}
        <span className="code text-[12px]">{locale}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">
          {dict.language.label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((option) => {
          const active = option === locale;
          return (
            <DropdownMenuItem
              key={option}
              onSelect={() => select(option)}
              lang={option}
              dir={option === "ar" ? "rtl" : "ltr"}
              className={cn("gap-2 text-[14.5px]", active && "font-medium")}
            >
              <span className="min-w-0 flex-1 truncate">{LOCALE_META[option].native}</span>
              {active && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
