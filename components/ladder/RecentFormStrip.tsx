import { cn } from "@/lib/utils/cn";

/**
 * Franja de los últimos resultados, más reciente a la derecha.
 *
 * `results` llega más reciente primero (así lo arma getLadderExtras), y se
 * invierte acá para que la franja se lea como una línea de tiempo.
 */
export function RecentFormStrip({
  results,
  size = "sm",
}: {
  results: boolean[];
  size?: "sm" | "md";
}) {
  if (results.length === 0) {
    return <span className="font-mono text-xs text-ink-muted">—</span>;
  }

  const chronological = [...results].reverse();
  const wins = results.filter(Boolean).length;

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Últimas ${results.length} partidas: ${wins} victorias, ${results.length - wins} derrotas`}
    >
      {chronological.map((win, i) => (
        <span
          key={i}
          title={win ? "Victoria" : "Derrota"}
          className={cn(
            "rounded-full transition-transform duration-[--dur-fast] hover:scale-y-125",
            size === "md" ? "h-4 w-1.5" : "h-3 w-1",
            win ? "bg-win" : "bg-loss",
            // La más reciente va a intensidad plena y las anteriores se
            // apagan, para que se lea la dirección del tiempo sin leyenda.
            i === chronological.length - 1 ? "opacity-100" : "opacity-55"
          )}
        />
      ))}
    </div>
  );
}
