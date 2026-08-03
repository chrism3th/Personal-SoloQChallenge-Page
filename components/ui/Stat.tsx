import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { cn } from "@/lib/utils/cn";

/**
 * Unidad de densidad del sitio: una cifra con su etiqueta, su detalle y,
 * opcionalmente, su tendencia. Extraído del `StatTile` que vivía privado
 * dentro de ProfileStatStrip para poder reutilizarlo en el resumen del grupo,
 * el comparador y el salón de la fama.
 *
 * Cuando se pasa `numericValue`, la cifra cuenta al entrar en pantalla; para
 * valores que no son un número (ej. "Platinum IV · 40 LP") se usa `value`.
 */
export function Stat({
  label,
  value,
  numericValue,
  formatValue,
  detail,
  icon: Icon,
  trend,
  valueClassName,
  compact = false,
  className,
}: {
  label: string;
  value?: ReactNode;
  numericValue?: number;
  formatValue?: (n: number) => string;
  detail?: ReactNode;
  icon?: LucideIcon;
  /** Positivo pinta verde, negativo rojo — para deltas contra el promedio. */
  trend?: { value: number; label: string } | null;
  valueClassName?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 px-4 py-3", className)}>
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
        {Icon && <Icon size={11} aria-hidden />}
        {label}
      </span>

      <span
        className={cn(
          "font-display leading-none text-ink",
          compact ? "text-lg" : "text-2xl",
          valueClassName
        )}
      >
        {numericValue !== undefined ? (
          <AnimatedNumber value={numericValue} format={formatValue} />
        ) : (
          (value ?? "—")
        )}
      </span>

      {(detail || trend) && (
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
          {detail}
          {trend && (
            <span className={trend.value >= 0 ? "text-win" : "text-loss"}>
              {trend.value >= 0 ? "▲" : "▼"} {trend.label}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
