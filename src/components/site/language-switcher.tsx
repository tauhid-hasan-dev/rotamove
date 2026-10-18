"use client";

import { useRouter, usePathname } from "next/navigation";
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
import { swapLocaleInPath } from "@/i18n/paths";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
 *
 * Languages are listed by endonym — "Deutsch", not "German" — because someone
 * hunting for their own language scans for the word they actually use. Those
 * names are never translated.
 *
 * Switching writes the cookie before navigating, so the choice outlives the
 * session and the proxy stops inferring from the visitor's IP. The current
 * path, query string and hash all carry across: changing language mid-enquiry
 * must not restart the enquiry.
 */
export function LanguageSwitcher({
  className,
  align = "end",
}: {
  className?: string;
  align?: "start" | "end";
}) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const select = (next: Locale) => {
    if (next === locale) return;

    // Written before navigating, not left to the proxy: the cookie has to be
    // in place for the next request, or a redirect could bounce straight back
    // to the geo-detected locale.
    rememberLocale(next);

    // Read from `location` rather than `useSearchParams()`. This component sits
    // in the header on every page, and subscribing to the query string there
    // opts the whole statically-rendered site into client-side rendering —
    // which fails the build outright without a Suspense boundary. The query is
    // only needed at the moment of the click, so a hook is the wrong tool.
    const { search, hash } = window.location;
    const target = swapLocaleInPath(pathname, next) + search + hash;
    startTransition(() => router.push(target));
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
        {/* The code, not the endonym: "Türkçe" in the header would push the nav
            around every time the language changed. */}
        <span className="code text-[12px]">{locale}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-52">
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
              // Each row renders in its own language, so the glyphs are a
              // preview of what you are about to get.
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
