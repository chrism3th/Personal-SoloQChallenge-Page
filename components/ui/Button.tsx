import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-obsidian-950 shadow-[0_0_24px_-6px_var(--color-accent)] hover:bg-accent-bright hover:shadow-[0_0_32px_-4px_var(--color-accent-bright)] disabled:bg-obsidian-700 disabled:text-ink-muted disabled:shadow-none",
  secondary:
    "bg-obsidian-800 text-ink border border-obsidian-700 hover:border-accent disabled:opacity-50",
  ghost: "bg-transparent text-ink-muted hover:text-ink disabled:opacity-50",
  danger: "bg-loss text-ink hover:brightness-110 disabled:opacity-50",
};

const baseClasses =
  "focus-ring inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-body font-semibold uppercase tracking-wide text-sm transition-all disabled:cursor-not-allowed";

type ButtonProps = ComponentProps<"button"> & { variant?: Variant };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button className={cn(baseClasses, VARIANT_CLASSES[variant], className)} {...props} />
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant };

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return (
    <Link className={cn(baseClasses, VARIANT_CLASSES[variant], className)} {...props} />
  );
}
