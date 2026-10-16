"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cityCountry, getCity, searchCityHits, type CityHit } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * One half of the search bar.
 *
 * Reads as a label + value until you touch it, then becomes a type-ahead in
 * place. The list is portalled via Radix rather than hand-positioned: an
 * absolutely-positioned panel gets trapped by any ancestor that creates a
 * stacking context, and the hero's entry animation does exactly that.
 */
export function CityField({
  label,
  value,
  onChange,
  placeholder,
  exclude,
  active,
  onActivate,
  onDismiss,
  align = "start",
  autoAdvance,
}: {
  label: string;
  value: string | null;
  onChange: (code: string) => void;
  placeholder: string;
  exclude?: string | null;
  active: boolean;
  onActivate: () => void;
  onDismiss: () => void;
  align?: "start" | "end";
  /** Called after a pick, so the bar can move focus to the next field. */
  autoAdvance?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = `${useId()}-cities`;

  // Reset the type-ahead the moment the field opens. Adjusting state during
  // render beats a setState-in-effect: no extra commit, no flash of the old
  // query.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (active) {
      setQuery("");
      setCursor(0);
    }
  }

  const selected = value ? getCity(value) : undefined;

  const hits = useMemo(
    () => searchCityHits(query, query ? 7 : 6).filter((h) => h.city.code !== exclude),
    [query, exclude],
  );

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor, active]);

  const pick = (hit: CityHit) => {
    onChange(hit.city.code);
    setQuery("");
    onDismiss();
    autoAdvance?.();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return onDismiss();
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
      pick(hits[cursor]);
    }
  };

  return (
    <Popover open={active} onOpenChange={(open) => !open && onDismiss()}>
      <PopoverAnchor asChild>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onActivate}
            className={cn(
              // matches the action button's height so the bar reads as one object
              "flex h-[52px] w-full flex-col items-start justify-center gap-[3px] rounded-full px-5 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "bg-muted/70" : "hover:bg-muted/50",
            )}
          >
            <span className="eyebrow text-[10px] leading-none">{label}</span>

            {active ? (
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={selected?.name ?? placeholder}
                aria-label={label}
                aria-autocomplete="list"
                aria-expanded={true}
                aria-controls={listboxId}
                role="combobox"
                className="w-full bg-transparent text-[16.5px] leading-none outline-none placeholder:text-muted-foreground/70"
              />
            ) : (
              <span
                className={cn(
                  "w-full truncate text-[16.5px] leading-none",
                  selected ? "" : "text-muted-foreground",
                )}
              >
                {selected ? selected.name : placeholder}
              </span>
            )}
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align={align}
        sideOffset={10}
        // focus belongs in the input we just opened, not in the list
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-[min(380px,calc(100vw-2rem))] gap-0 rounded-2xl p-1.5 shadow-float"
      >
        {!query && <p className="eyebrow px-3 pb-1 pt-2">Popular</p>}

        {hits.length === 0 ? (
          <p className="px-3 py-5 text-center text-[14px] text-muted-foreground">
            No match for “{query}”
          </p>
        ) : (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="max-h-[300px] overflow-y-auto scrollbar-slim"
          >
            {hits.map((hit, i) => {
              const country = cityCountry(hit.city);
              return (
                <li key={hit.city.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === cursor}
                    onMouseEnter={() => setCursor(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(hit)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      i === cursor ? "bg-accent" : "",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-[15px]">
                        <Highlight
                          text={hit.city.name}
                          start={hit.field === "name" ? hit.start : -1}
                          length={hit.length}
                        />
                      </span>
                      <span className="ml-2 text-[13px] text-muted-foreground">
                        <Highlight
                          text={country.name}
                          start={hit.field === "country" ? hit.start : -1}
                          length={hit.length}
                        />
                      </span>
                    </span>
                    <span className="code shrink-0 text-[11.5px] text-muted-foreground">
                      {hit.city.code}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Bolds the matched run without re-implementing search in the view. */
function Highlight({
  text,
  start,
  length,
}: {
  text: string;
  start: number;
  length: number;
}) {
  if (start < 0 || length <= 0 || start + length > text.length) return <>{text}</>;
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-transparent font-semibold text-foreground">
        {text.slice(start, start + length)}
      </mark>
      {text.slice(start + length)}
    </>
  );
}
