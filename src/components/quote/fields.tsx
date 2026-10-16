"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FieldSet({
  legend,
  hint,
  children,
  className,
}: {
  legend: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-1 text-[15px] font-semibold">{legend}</legend>
      {hint && <p className="mb-3 text-[13.5px] text-muted-foreground">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </fieldset>
  );
}

export function OptionCard({
  selected,
  onSelect,
  title,
  hint,
  meta,
  icon,
  className,
  compact = false,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  hint?: string;
  meta?: string;
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl border bg-background text-left transition-all duration-200 outline-none",
        compact ? "px-3 py-2.5" : "p-4",
        "hover:border-foreground/25 hover:shadow-sm",
        "focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20",
        selected &&
          "border-brand bg-brand-soft shadow-[0_0_0_1px_var(--brand)] dark:bg-accent dark:shadow-[0_0_0_1px_var(--brand)]",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "mt-0.5 shrink-0 text-muted-foreground transition-colors",
            selected && "text-brand",
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("block font-medium", compact ? "text-[14px]" : "text-[15px]")}>
            {title}
          </span>
          {meta && (
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tnum">
              {meta}
            </span>
          )}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      {selected && !meta && (
        <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand text-white">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}

export function ToggleChip({
  active,
  onToggle,
  children,
  meta,
}: {
  active: boolean;
  onToggle: () => void;
  children: ReactNode;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13.5px] transition-all duration-200 outline-none",
        "hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-brand/20",
        active
          ? "border-brand bg-brand text-white shadow-sm"
          : "bg-background text-foreground",
      )}
    >
      {active && <Check className="size-3" strokeWidth={3} />}
      {children}
      {meta && (
        <span
          className={cn(
            "text-[11px] tnum",
            active ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {meta}
        </span>
      )}
    </button>
  );
}

export function SwitchRow({
  checked,
  onChange,
  title,
  hint,
  meta,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border bg-background p-3.5 text-left transition-all duration-200 outline-none",
        "hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-brand/20",
        checked && "border-brand/60 bg-brand-soft dark:bg-accent/60",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-[14.5px] font-medium">{title}</span>
          {meta && (
            <span className="text-[11px] text-muted-foreground tnum">{meta}</span>
          )}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
          checked ? "bg-brand" : "bg-muted-foreground/25",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
