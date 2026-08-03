"use client";

import { AnimatedBar } from "@/components/motion/AnimatedBar";
import { cn } from "@/lib/utils/cn";

export type BarSegment = {
  value: number;
  /** Cualquier color CSS — normalmente una var de tema (`var(--color-win)`). */
  color: string;
  label?: string;
};

const HEIGHT_CLASS = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
} as const;

/**
 * Barra unificada del sitio. Reemplaza las tres implementaciones a mano que
 * convivían antes (el `WinrateBar` compartido, la barra de volumen de
 * RoleWinrateBars y la de winrate de TopChampionsGrid), cada una con su propia
 * altura, radio y criterio de color.
 *
 * Soporta segmentos apilados (V/D) o uno solo (progreso), y anima el llenado
 * al entrar en pantalla.
 */
export function Bar({
  segments,
  size = "md",
  className,
  ariaLabel,
  animate = true,
}: {
  segments: BarSegment[];
  size?: keyof typeof HEIGHT_CLASS;
  className?: string;
  ariaLabel?: string;
  animate?: boolean;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden rounded-full bg-obsidian-800",
        HEIGHT_CLASS[size],
        className
      )}
      role="img"
      aria-label={ariaLabel}
    >
      {segments.map((segment, i) => {
        const percent = total === 0 ? 0 : (segment.value / total) * 100;
        return animate ? (
          <AnimatedBar
            key={i}
            percent={percent}
            style={{ background: segment.color }}
            delay={i * 0.05}
          />
        ) : (
          <span
            key={i}
            className="block h-full"
            style={{ width: `${percent}%`, background: segment.color }}
          />
        );
      })}
    </div>
  );
}

/** Atajo para el caso más repetido del sitio: victorias vs derrotas. */
export function WinLossBar({
  wins,
  losses,
  size = "md",
  className,
}: {
  wins: number;
  losses: number;
  size?: keyof typeof HEIGHT_CLASS;
  className?: string;
}) {
  return (
    <Bar
      size={size}
      className={className}
      ariaLabel={`${wins} victorias, ${losses} derrotas`}
      segments={[
        { value: wins, color: "var(--color-win)", label: "Victorias" },
        { value: losses, color: "var(--color-loss)", label: "Derrotas" },
      ]}
    />
  );
}
