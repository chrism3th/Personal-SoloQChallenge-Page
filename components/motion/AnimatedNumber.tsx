"use client";

import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

/**
 * Cifra que cuenta hasta su valor al entrar en pantalla. Se usa en LP, winrate
 * y contadores de partidas.
 *
 * Siempre lleva `.tabular`: sin cifras de ancho fijo el conteo hace bailar el
 * layout de al lado mientras corre.
 */
export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  className,
  duration = DURATION.slow,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  // Arranca en el valor final, no en 0: en servidor no hay matchMedia, así que
  // useReducedMotion() no coincide entre servidor y cliente, y empezar en 0
  // producía un error de hidratación. El conteo se dispara después de montar.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduceMotion || !inView) return;

    // El setState vive dentro del callback del subscribe (no en el cuerpo del
    // efecto), que es lo que espera React para sincronizar con un sistema
    // externo como el motion value.
    const unsubscribe = motionValue.on("change", setDisplay);
    motionValue.set(0);
    const controls = animate(motionValue, value, { duration, ease: EASE_OUT });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [inView, value, reduceMotion, duration, motionValue]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {format(display)}
    </span>
  );
}
