"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, dirFor, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localePath } from "@/i18n/paths";
import * as fmt from "@/i18n/format";
import { plural, type Plural } from "@/i18n/plural";

/**
 * Locale context for client components.
 *
 * Server components read the dictionary directly from `getDictionary(locale)`;
 * the interactive half of the product — search box, wizard, results board —
 * reaches it through this provider instead of being prop-drilled from eight
 * different pages.
 *
 * One locale's dictionary crosses to the client, not all eight.
 */
interface I18nValue {
  locale: Locale;
  dict: Dictionary;
  dir: "ltr" | "rtl";
  /** True for Arabic. Lets a component flip a direction-bearing animation. */
  rtl: boolean;
  /** Prefixes an internal path with the active locale. */
  href: (path: string) => string;
  t: {
    fill: (template: string, values: Record<string, string | number>) => string;
    count: (forms: Plural, count: number) => string;
    plural: (forms: Plural, count: number, display?: string) => string;
    number: (value: number) => string;
    compact: (value: number) => string;
    percent: (ratio: number, digits?: number) => string;
    decimal: (value: number, digits?: number) => string;
    year: (year: number) => string;
    usd: (value: number) => string;
    dateLong: (iso: string) => string;
    dateShort: (iso: string) => string;
    dateRange: (range: [string, string]) => string;
    volume: (m3: number) => string;
    days: (range: [number, number]) => string;
    weeks: (weeks: number) => string;
    responseTime: (mins: number) => string;
    country: (iso: string, fallback: string) => string;
    city: (city: { name: string; country: string }, fallback: string) => string;
    list: (items: string[]) => string;
  };
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dict,
      dir: dirFor(locale),
      rtl: dirFor(locale) === "rtl",
      href: (path) => localePath(locale, path),
      t: {
        fill: fmt.fill,
        count: (forms, count) => fmt.formatCount(locale, forms, count),
        plural: (forms, count, display) => plural(locale, forms, count, display),
        number: (value) => fmt.formatNumber(locale, value),
        compact: (value) => fmt.formatCompact(locale, value),
        percent: (ratio, digits) => fmt.formatPercent(locale, ratio, digits),
        decimal: (value, digits) => fmt.formatDecimal(locale, value, digits),
        year: (year) => fmt.formatYear(locale, year),
        usd: (value) => fmt.formatUsd(locale, value),
        dateLong: (iso) => fmt.formatDateLong(locale, iso),
        dateShort: (iso) => fmt.formatDateShort(locale, iso),
        dateRange: (range) => fmt.formatDateRange(locale, range),
        volume: (m3) => fmt.formatVolume(locale, dict, m3),
        days: (range) => fmt.formatDays(locale, dict, range),
        weeks: (weeks) => fmt.formatWeeks(locale, dict, weeks),
        responseTime: (mins) => fmt.formatResponseTime(locale, dict, mins),
        country: (iso, fallback) => fmt.countryName(locale, iso, fallback),
        city: (city, fallback) => fmt.cityLabel(locale, city, fallback),
        list: (items) => fmt.formatList(locale, items),
      },
    }),
    [locale, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error(
      `useI18n must be used inside <I18nProvider>. Wrap the route in app/[locale]/layout.tsx (default locale: ${DEFAULT_LOCALE}).`,
    );
  }
  return value;
}
