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
  const [display, setDisplay] = useState(() => format(reduceMotion ? value : 0));

  useEffect(() => {
    // Con movimiento reducido no se cuenta: se muestra el valor final directo.
    if (reduceMotion) {
      setDisplay(format(value));
      return;
    }
    if (!inView) return;

    const unsubscribe = motionValue.on("change", (latest) => setDisplay(format(latest)));
    const controls = animate(motionValue, value, { duration, ease: EASE_OUT });

    return () => {
      controls.stop();
      unsubscribe();
    };
    // `format` se re-crea en cada render del padre si viene inline; se omite a
    // propósito para no reiniciar el conteo en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduceMotion, duration, motionValue]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {display}
    </span>
  );
}
