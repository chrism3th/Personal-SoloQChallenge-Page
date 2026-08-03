import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "win" | "loss" | "neutral" | "accent" | "tier";

const TONE_CLASSES: Record<Tone, string> = {
  win: "border-win/30 bg-win/10 text-win",
  loss: "border-loss/30 bg-loss/10 text-loss",
  neutral: "border-obsidian-700 bg-obsidian-800/70 text-ink-muted",
  accent: "border-accent/35 bg-accent/10 text-accent",
  // `tier` se pinta con --glow-color, que llega por style desde tierGlowVar().
  tier: "border-[color-mix(in_oklab,var(--glow-color)_35%,transparent)] bg-[color-mix(in_oklab,var(--glow-color)_12%,transparent)] text-[var(--glow-color)]",
};

const SIZE_CLASSES = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
} as const;

/**
 * Chip de estado. Absorbe lo que antes era `StreakBadge` y los cinco o seis
 * `<span>` con clases sueltas repartidos por el ladder y el perfil.
 */
export function Badge({
  children,
  tone = "neutral",
  size = "md",
  glowColor,
  className,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  size?: keyof typeof SIZE_CLASSES;
  /** Solo para `tone="tier"`: el color real del rango del jugador. */
  glowColor?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={glowColor ? ({ "--glow-color": glowColor } as CSSProperties) : undefined}
      className={cn(
        "inline-flex items-center rounded-chip border font-mono font-semibold uppercase tracking-wider whitespace-nowrap",
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className
      )}
    >
      {children}
    </span>
  );
}
