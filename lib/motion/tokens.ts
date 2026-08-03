/**
 * Duraciones y curvas de la capa de movimiento, espejando los tokens CSS de
 * app/globals.css (--dur-* / --ease-out). Se duplican en TS porque `motion`
 * necesita números y arrays de bezier, no strings de CSS — mantener ambos
 * lados en sync si se tocan.
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  fast: 0.12,
  base: 0.22,
  slow: 0.4,
} as const;

/** Retardo entre hijos de una lista escalonada (podio, filas, tarjetas). */
export const STAGGER_STEP = 0.05;

/** Spring compartido por las barras y los indicadores deslizantes. */
export const SPRING = { type: "spring", stiffness: 220, damping: 30 } as const;

/** Transición por defecto: entradas y fundidos. */
export const TRANSITION = { duration: DURATION.base, ease: EASE_OUT } as const;

/** Variants padre/hijo reutilizables para listas con entrada escalonada. */
export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_STEP } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: TRANSITION },
};
