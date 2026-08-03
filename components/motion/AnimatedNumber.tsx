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
  const motionValue = useMotionValue(0);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Con movimiento reducido no hay animación que montar: el valor final se
    // deriva en el render de abajo, sin pasar por estado.
    if (reduceMotion || !inView) return;

    // El setState vive dentro del callback del subscribe (no en el cuerpo del
    // efecto), que es lo que espera React para sincronizar con un sistema
    // externo como el motion value.
    const unsubscribe = motionValue.on("change", setAnimatedValue);
    const controls = animate(motionValue, value, { duration, ease: EASE_OUT });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [inView, value, reduceMotion, duration, motionValue]);

  const display = reduceMotion ? value : animatedValue;

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {format(display)}
    </span>
  );
}
