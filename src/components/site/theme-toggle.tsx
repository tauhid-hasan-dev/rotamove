"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

/**
 * The icons swap purely through the `dark:` variant, so there is no mounted
 * flag and no hydration flash — the button renders identically on both sides
 * and only the click handler needs to know the current theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { dict } = useI18n();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={dict.common.toggleTheme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
