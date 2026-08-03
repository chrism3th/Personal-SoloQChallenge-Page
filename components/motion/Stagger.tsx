"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { staggerChild, staggerParent } from "@/lib/motion/tokens";

/**
 * Contenedor de lista con entrada escalonada: cada `StaggerItem` hijo entra
 * un poco después que el anterior. Se usa en el podio, las filas del ladder,
 * la grilla de campeones y el historial de partidas.
 *
 * `as` permite conservar la semántica correcta del contenedor (`ol`/`ul`)
 * en vez de forzar un `div` alrededor de los `li`.
 */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ol" | "ul";
}) {
  const Component = as === "ol" ? m.ol : as === "ul" ? m.ul : m.div;

  return (
    <Component
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8%" }}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Component = as === "li" ? m.li : m.div;

  return (
    <Component className={className} variants={staggerChild}>
      {children}
    </Component>
  );
}
