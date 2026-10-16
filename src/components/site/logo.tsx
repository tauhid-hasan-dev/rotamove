import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-grid size-8 shrink-0 place-items-center", className)}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-full" role="presentation">
        <circle cx="16" cy="16" r="16" fill="var(--brand)" />
        {/* departure point, arc, arrowhead — a route leaving */}
        <circle cx="9.5" cy="21.5" r="2.4" fill="#15150f" />
        <path
          d="M12.4 20.2 Q17 10.5 22.4 11.4"
          fill="none"
          stroke="#15150f"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path d="M19.4 8.2 L24 11.2 L19.9 14.8 Z" fill="#15150f" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5 outline-none", className)}
      aria-label="Rotamove home"
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[14deg]" />
      {!compact && (
        <span className="text-[18px] font-semibold leading-none tracking-[-0.04em]">
          rotamove
        </span>
      )}
    </Link>
  );
}
