"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cityCountry, getCity, searchCityHits } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * Hub chooser for the lane form.
 *
 * The public search bar has its own type-ahead, built to look like one
 * continuous pill. This is the same data behind a plain form control, because
 * a dispatcher filling in a lane is doing data entry, not being sold to — and
 * because the search bar's control cannot be dropped into a dialog without
 * dragging its layout along with it.
 */
export function HubPicker({
  label,
  value,
  onChange,
  exclude,
  invalid,
}: {
  label: string;
  value: string | null;
  onChange: (code: string) => void;
  /** The other end of the lane — never offer it on this side. */
  exclude?: string | null;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${useId()}-hubs`;

  const selected = value ? getCity(value) : undefined;
  const hits = useMemo(
    () => searchCityHits(query, query ? 8 : 6).filter((hit) => hit.city.code !== exclude),
    [query, exclude],
  );

  const pick = (code: string) => {
    onChange(code);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="min-w-0">
      <span className="mb-2 block text-[13.5px]">{label}</span>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listboxId}
            className={cn(
              "flex h-12 w-full items-center gap-2 rounded-2xl border bg-background px-3.5 text-start transition-colors",
              "outline-none hover:border-foreground/25 focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20",
              invalid && "border-destructive",
            )}
          >
            <span className="min-w-0 flex-1 truncate text-[15px]">
              {selected ? (
                <>
                  {selected.name}
                  <span className="ms-2 text-[12.5px] text-muted-foreground">
                    {cityCountry(selected).name}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Search a hub…</span>
              )}
            </span>
            {selected && <span className="code shrink-0 text-[11.5px]">{selected.code}</span>}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="w-[min(360px,calc(100vw-2.5rem))] gap-0 rounded-2xl p-1.5 shadow-float"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <div className="flex items-center gap-2 border-b px-2.5 pb-2 pt-1">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="City, country or code"
              aria-label="Search hubs"
              className="w-full bg-transparent py-1 text-[14.5px] outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          {hits.length === 0 ? (
            <p className="px-3 py-5 text-center text-[13.5px] text-muted-foreground">
              No hub matches “{query}”.
            </p>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-[260px] overflow-y-auto scrollbar-slim pt-1"
            >
              {hits.map((hit) => {
                const active = hit.city.code === value;
                return (
                  <li key={hit.city.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(hit.city.code)}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors hover:bg-accent"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        <span className="text-[14.5px]">{hit.city.name}</span>
                        <span className="ms-2 text-[12.5px] text-muted-foreground">
                          {cityCountry(hit.city).name}
                        </span>
                      </span>
                      {active && <Check className="size-3.5 shrink-0 text-brand" strokeWidth={3} />}
                      <span className="code shrink-0 text-[11px] text-muted-foreground">
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
    </div>
  );
}
