/** Encabezado de columnas del ladder — mismo grid-template que LadderRow, oculto en mobile igual que el resto de las columnas densas. */
export function LadderHeader() {
  return (
    <div
      className="hidden grid-cols-[3rem_1fr_6rem_9rem_9rem_auto] items-center gap-2 px-4 pb-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted sm:grid sm:gap-4 sm:pr-10 lg:grid-cols-[3rem_minmax(12rem,1fr)_6rem_9rem_9rem_6.5rem_5rem_4.5rem_6rem_4rem]"
      aria-hidden
    >
      <span>#</span>
      <span>Jugador</span>
      <span>Rol</span>
      <span>Elo</span>
      <span>V/D</span>
      <span className="hidden lg:block">Campeones</span>
      <span className="hidden lg:block">Racha</span>
      <span className="hidden text-right lg:block">±LP</span>
      <span className="hidden lg:block">Estado</span>
      <span />
    </div>
  );
}
