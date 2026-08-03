import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * `<select>` nativo estilizado. Se mantiene nativo a propósito: en móvil el
 * selector del sistema es mejor que cualquier dropdown propio, y no hay que
 * reimplementar teclado ni foco.
 */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative inline-flex items-center">
      <select
        className={cn(
          "focus-ring appearance-none rounded-chip border border-obsidian-700 bg-obsidian-900 py-1.5 pl-3.5 pr-9",
          "font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:border-accent",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 text-ink-muted"
        aria-hidden
      />
    </span>
  );
}
