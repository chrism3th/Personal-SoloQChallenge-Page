import { cn } from "@/lib/utils/cn";

/** Franja de los últimos resultados (más antiguo primero, izquierda a derecha). */
export function RecentFormStrip({ results }: { results: boolean[] }) {
  if (results.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[...results].reverse().map((win, i) => (
        <span
          key={i}
          className={cn("h-3 w-1 rounded-full", win ? "bg-win" : "bg-loss")}
        />
      ))}
    </div>
  );
}
