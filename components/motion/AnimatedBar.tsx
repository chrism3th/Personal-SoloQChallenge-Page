"use client";

import { m } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { SPRING } from "@/lib/motion/tokens";

/**
 * Segmento de barra que crece desde 0 hasta su porcentaje al entrar en
 * pantalla. Es la pieza que usa `components/ui/Bar` por dentro; no se usa
 * suelta salvo para barras con forma propia (ej. el anillo de winrate).
 */
export function AnimatedBar({
  percent,
  className,
  style,
  delay = 0,
}: {
  percent: number;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <m.span
      className={cn("block h-full", className)}
      style={style}
      initial={{ width: 0 }}
      whileInView={{ width: `${clamped}%` }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ ...SPRING, delay }}
    />
  );
}
