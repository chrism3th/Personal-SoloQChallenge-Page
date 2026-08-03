"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import type { ReactNode } from "react";

/**
 * Raíz de la capa de movimiento, montada una sola vez en app/layout.tsx.
 *
 * - `LazyMotion` + `domMax` carga las features bajo demanda en vez del bundle
 *   completo de `motion`. Se usa `domMax` y no `domAnimation` porque los
 *   indicadores deslizantes de Tabs y del nav usan `layoutId`, que necesita
 *   layout projection.
 * - `strict` obliga a usar el componente corto `m.*` en vez de `motion.*`:
 *   `motion.div` recarga el bundle completo y anula el beneficio de LazyMotion,
 *   así que en modo estricto lanza error si alguien lo usa por descuido.
 * - `reducedMotion="user"` es la respuesta de accesibilidad de todo el sitio:
 *   cuando el sistema pide `prefers-reduced-motion`, `motion` deja los
 *   elementos en su estado final en vez de animarlos, sin que cada componente
 *   tenga que repetir la media query.
 *
 * Envuelve children renderizados en servidor: ser client component no obliga
 * a que el árbol de abajo también lo sea.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
