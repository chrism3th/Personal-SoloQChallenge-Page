import { cn } from "@/lib/utils/cn";

/**
 * Bloque de carga. Existe para que el estado de carga tenga la *forma* de lo
 * que viene después: antes el panel de jugador mostraba una línea de texto
 * "Cargando…" y después aparecía de golpe un panel completo, con un salto de
 * layout de varios cientos de píxeles.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-card bg-obsidian-800/80", className)}
      aria-hidden
    />
  );
}

/** Esqueleto con la silueta del panel de jugador (header + KPIs + contenido). */
export function PlayerPanelSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Cargando panel del jugador">
      <div className="panel flex flex-wrap items-center justify-between gap-6 px-6 py-8">
        <div className="flex items-center gap-4">
          <Skeleton className={cn("rounded-xl", compact ? "h-12 w-12" : "h-16 w-16")} />
          <div className="flex flex-col gap-2">
            <Skeleton className={cn("w-48", compact ? "h-7" : "h-10")} />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>

      <div className="panel grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-64 w-full rounded-panel" />
    </div>
  );
}
