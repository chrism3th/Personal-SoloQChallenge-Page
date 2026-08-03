"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

/**
 * Fundido + subida al entrar en viewport, una sola vez. Pensado para envolver
 * secciones renderizadas en servidor: los `children` llegan ya renderizados,
 * así que envolver algo con Reveal no lo convierte en client component.
 */
export function Reveal({
  children,
  delay = 0,
  y = 12,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: DURATION.base, ease: EASE_OUT, delay }}
    >
      {children}
    </m.div>
  );
}
