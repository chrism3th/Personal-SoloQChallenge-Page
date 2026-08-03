import { LADDER_GRID } from "./grid";
import { cn } from "@/lib/utils/cn";

/**
 * Encabezado de columnas del ladder. Solo existe desde `lg`, que es donde la
 * fila usa la grilla; por debajo cada fila refluye a una tarjeta apilada con
 * sus propias etiquetas, así que un encabezado de columnas no aplicaría.
 */
export function LadderHeader() {
  return (
    <div
      className={cn(
        "hidden items-center gap-3 px-5 pb-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted lg:grid",
        LADDER_GRID
      )}
      aria-hidden
    >
      <span>#</span>
      <span>Jugador</span>
      <span>Rol</span>
      <span>Elo</span>
      <span>V/D</span>
      <span>Campeones</span>
      <span>Forma</span>
      <span>Racha</span>
      <span className="text-right">±LP</span>
      <span>Estado</span>
      <span />
    </div>
  );
}
