import { cn } from "@/lib/utils/cn";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "focus-ring w-full rounded-xl border border-obsidian-700 bg-obsidian-900 px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-ink-muted",
        "outline-none focus-visible:border-accent",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "font-body text-xs font-semibold uppercase tracking-widest text-ink-muted",
        className
      )}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="font-body text-sm text-loss">{children}</p>;
}
