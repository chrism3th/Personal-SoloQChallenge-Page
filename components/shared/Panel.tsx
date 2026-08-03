import type { CSSProperties, ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type PanelProps = ComponentProps<"div"> & {
  /** Halo de color alrededor del panel — recibe cualquier color CSS (ej. el color de tier de un jugador), para "paneles con identidad". */
  glowColor?: string;
};

/**
 * Contenedor de vidrio esmerilado con esquinas redondeadas y halo suave —
 * motivo "firma" del rediseño neo/futurista. Reemplaza al viejo
 * `.diagonal-panel` de corte diagonal + dorado hextech.
 */
export function Panel({ children, className, glowColor, style, ...props }: PanelProps) {
  return (
    <div
      className={cn("panel", glowColor && "panel--glow", className)}
      style={glowColor ? ({ "--glow-color": glowColor, ...style } as CSSProperties) : style}
      {...props}
    >
      {children}
    </div>
  );
}
