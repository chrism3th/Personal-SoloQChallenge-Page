import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Ancho de contenido del sitio. Antes convivían `max-w-3xl`, `max-w-5xl` y
 * `max-w-7xl` según qué página se hubiera escrito primero, así que pasar del
 * ladder a temporadas movía el margen lateral sin ningún motivo.
 *
 * - `wide`: tablas densas (ladder, temporada en curso, comparador).
 * - `default`: lectura y formularios (perfil, listados, portada).
 */
export function Container({
  children,
  size = "default",
  className,
  as: Component = "main",
}: {
  children: ReactNode;
  size?: "default" | "wide";
  className?: string;
  as?: "main" | "div" | "section";
}) {
  return (
    <Component
      className={cn(
        "mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-10",
        size === "wide" ? "max-w-7xl" : "max-w-5xl",
        className
      )}
    >
      {children}
    </Component>
  );
}
