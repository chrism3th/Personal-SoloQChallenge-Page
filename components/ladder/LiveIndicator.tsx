"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

function elapsedLabel(startTime: string, now: number): string | null {
  const startedAt = new Date(startTime).getTime();
  if (Number.isNaN(startedAt)) return null;
  const minutes = Math.floor((now - startedAt) / 60_000);
  // Negativo significa reloj desfasado entre Riot y el cliente; mejor no
  // mostrar nada que mostrar "hace -3 min".
  if (minutes < 0) return null;
  return `${minutes} min`;
}

/**
 * Indicador de partida en curso. Antes era solo un punto rojo con la palabra
 * "En vivo"; ahora dice con qué campeón y desde hace cuánto, usando
 * `live_status.champion_id` y `game_start_time`, que el cron ya guardaba y
 * ninguna consulta leía.
 *
 * El nombre del campeón se resuelve en servidor (ver LadderTable) porque el
 * mapeo id -> nombre necesita un fetch a Data Dragon.
 */
export function LiveIndicator({
  championName,
  championIconUrl,
  gameStartTime,
  compact = false,
}: {
  championName?: string | null;
  championIconUrl?: string | null;
  gameStartTime?: string | null;
  compact?: boolean;
}) {
  // Arranca en null a propósito: el servidor y el primer render del cliente
  // coinciden en "todavía sin hora", y el minutero recién aparece cuando el
  // cliente ya montó. Evita el desajuste de hidratación de comparar contra
  // dos relojes distintos.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!gameStartTime) return;

    const tick = () => setNow(Date.now());
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 30_000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [gameStartTime]);

  const elapsed = gameStartTime && now != null ? elapsedLabel(gameStartTime, now) : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono uppercase tracking-widest text-loss",
        compact ? "text-[10px]" : "text-xs"
      )}
    >
      <span className="live-pulse h-2 w-2 shrink-0 rounded-full bg-loss" aria-hidden />
      {championIconUrl && (
        <Image
          src={championIconUrl}
          alt=""
          width={16}
          height={16}
          unoptimized
          className="rounded-sm border border-loss/40"
        />
      )}
      <span className="truncate">
        {championName ?? "En vivo"}
        {elapsed && <span className="ml-1 text-ink-muted tabular">{elapsed}</span>}
      </span>
    </span>
  );
}
