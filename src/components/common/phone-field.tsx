"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DIAL_COUNTRIES,
  composePhone,
  dialFor,
  flagFor,
  isNetworkCountry,
  parsePhone,
} from "@/lib/phone";
import { foldText } from "@/lib/geo";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * A phone number as two controls over one string.
 *
 * The dialling code is a picker and the rest is a plain input, but what
 * leaves here is still `"+90 532 111 22 33"` — see `lib/phone.ts` for why
 * the stored shape did not change.
 *
 * The picker opens on the country the visitor is browsing from. That comes
 * from `useI18n().country`, which is the locale's country on the server and
 * the edge's geo reading once hydrated, so the common case never flickers.
 */
export function PhoneField({
  id,
  value,
  onChange,
  placeholder,
  invalid,
  verified,
  disabled,
  autoComplete = "tel",
  className,
  inputClassName,
}: {
  id: string;
  /** The whole number, dialling code included. */
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  invalid?: boolean;
  verified?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
  inputClassName?: string;
}) {
  const { dict, t, country } = useI18n();
  const px = dict.phoneField;

  const [iso, setIso] = useState(() => parsePhone(value, country).iso);
  const [open, setOpen] = useState(false);

  /*
   * Follow the geo reading, but only into an empty field.
   *
   * The country arrives one frame after hydration, and a visitor who has
   * already picked a code — or already typed a number — must not have it
   * swapped underneath them. Adjusted during render rather than in an
   * effect, which is the pattern the rest of this codebase uses: no second
   * commit, no flash of the superseded flag.
   */
  const [lastCountry, setLastCountry] = useState(country);
  if (lastCountry !== country) {
    setLastCountry(country);
    if (!value.trim()) setIso(country);
  }

  /*
   * Adopt a dialling code that came in with the value — a restored draft, a
   * saved partner profile, a number pasted whole.
   */
  const incoming = value.trim().startsWith("+") ? parsePhone(value, iso) : null;
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    if (incoming && incoming.iso !== iso) setIso(incoming.iso);
  }

  const national = incoming ? incoming.national : value;

  const pick = (nextIso: string) => {
    setIso(nextIso);
    setOpen(false);
    onChange(composePhone(nextIso, national));
  };

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <DialPicker
        iso={iso}
        open={open}
        onOpenChange={setOpen}
        onPick={pick}
        disabled={disabled}
        label={px.countryLabel}
      />

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        disabled={disabled}
        value={national}
        onChange={(e) => onChange(composePhone(iso, e.target.value))}
        placeholder={placeholder ?? px.numberPlaceholder}
        aria-label={px.numberLabel}
        // `dir="ltr"` even in Arabic: a dialled number is a sequence, and
        // mirroring it puts the trunk digit on the wrong end.
        dir="ltr"
        className={cn(
          "h-12 min-w-0 flex-1 rounded-2xl border bg-transparent px-4 text-[15px] tnum outline-none transition-colors",
          "focus:border-brand focus:ring-[3px] focus:ring-brand/20",
          "disabled:cursor-not-allowed disabled:opacity-55",
          invalid && "border-destructive",
          verified && "border-verify/50",
          inputClassName,
        )}
      />

      {/* What actually gets submitted, for anything reading the form rather
          than React state. Kept in sync by the same `onChange` above. */}
      <input type="hidden" name={id} value={value} readOnly />

      <span className="sr-only" aria-live="polite">
        {t.fill(px.selected, {
          country: t.country(iso, iso),
          code: `+${dialFor(iso)}`,
        })}
      </span>
    </div>
  );
}

/** The flag-and-code button, and the searchable list behind it. */
function DialPicker({
  iso,
  open,
  onOpenChange,
  onPick,
  disabled,
  label,
}: {
  iso: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (iso: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const { dict, t } = useI18n();
  const px = dict.phoneField;
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = `${useId()}-dial`;

  // Fresh search each time it opens, adjusted during render.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setCursor(0);
    }
  }

  /*
   * Names come from `Intl.DisplayNames` via `t.country`, so the list is in
   * the reader's language and searching it matches what they can see. The
   * English name is folded in as well — someone typing "Germany" on the
   * German site should still find Deutschland.
   */
  const entries = useMemo(
    () =>
      DIAL_COUNTRIES.map((c) => ({
        ...c,
        name: t.country(c.iso, c.iso),
        network: isNetworkCountry(c.iso),
      })),
    [t],
  );

  const hits = useMemo(() => {
    const needle = foldText(query.trim().replace(/^\+/, ""));
    if (!needle) return entries;
    return entries.filter(
      (c) =>
        foldText(c.name).includes(needle) ||
        c.dial.startsWith(needle) ||
        foldText(c.iso).startsWith(needle),
    );
  }, [entries, query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return onOpenChange(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(hits.length - 1, c + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    }
    if (e.key === "Enter" && hits[cursor]) {
      e.preventDefault();
      onPick(hits[cursor].iso);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label}: ${t.country(iso, iso)} +${dialFor(iso)}`}
          className={cn(
            "inline-flex h-12 shrink-0 items-center gap-1.5 rounded-2xl border px-3 text-[15px] transition-colors",
            "hover:border-foreground/25 hover:bg-muted",
            "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-55",
          )}
        >
          <span className="text-[17px] leading-none" aria-hidden>
            {flagFor(iso)}
          </span>
          <span className="tnum" dir="ltr">
            +{dialFor(iso)}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[min(340px,calc(100vw-2rem))] gap-0 rounded-2xl p-1.5 shadow-float"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={px.searchPlaceholder}
            aria-label={px.searchPlaceholder}
            aria-autocomplete="list"
            aria-controls={listboxId}
            role="combobox"
            aria-expanded
            className="h-10 w-full rounded-xl border bg-transparent ps-9 pe-3 text-[14px] outline-none focus:border-brand"
          />
        </div>

        {hits.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13.5px] text-muted-foreground">
            {t.fill(px.noMatch, { query: query.trim() })}
          </p>
        ) : (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="mt-1.5 max-h-[280px] overflow-y-auto scrollbar-slim"
          >
            {hits.map((c, i) => (
              <li key={`${c.iso}-${c.dial}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.iso === iso}
                  onMouseEnter={() => setCursor(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPick(c.iso)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start transition-colors",
                    i === cursor && "bg-accent",
                  )}
                >
                  <span className="text-[16px] leading-none" aria-hidden>
                    {flagFor(c.iso)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">{c.name}</span>
                  {/* A corridor we actually run. Worth a mark here because
                      the same picker serves a quote form, where it is the
                      difference between a lane and a long shot. */}
                  {c.network && (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-brand"
                      title={px.networkHint}
                      aria-label={px.networkHint}
                    />
                  )}
                  <span className="shrink-0 text-[13px] text-muted-foreground tnum" dir="ltr">
                    +{c.dial}
                  </span>
                  {c.iso === iso && (
                    <Check className="size-3.5 shrink-0 text-verify" strokeWidth={3} aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
