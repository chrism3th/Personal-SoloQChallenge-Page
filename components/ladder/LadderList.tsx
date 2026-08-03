"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { LadderHeader } from "./LadderHeader";
import { LadderRow, type LadderRowLive } from "./LadderRow";
import { Select } from "@/components/ui/Select";
import { Panel } from "@/components/shared/Panel";
import type { LadderEntry } from "@/lib/ranking/season-scope";
import { ROLE_LABELS } from "@/lib/riot/roles";
import { winrate } from "@/lib/ranking/lp-math";
import { cn } from "@/lib/utils/cn";

type SortKey = "rank" | "winrate" | "games" | "streak";

const SORT_LABELS: Record<SortKey, string> = {
  rank: "Elo",
  winrate: "Winrate",
  games: "Partidas",
  streak: "Racha",
};

/**
 * Lista del ladder con barra de herramientas. El filtrado y el orden pasan en
 * cliente sobre las entradas que la página ya cargó: el ladder es de decenas
 * de filas como mucho, así que no vale la pena un ida y vuelta al servidor
 * por cada tecla.
 */
export function LadderList({
  entries,
  version,
  seasonId,
  liveByProfileId,
}: {
  entries: LadderEntry[];
  version: string;
  seasonId: string | null;
  liveByProfileId: Record<string, LadderRowLive>;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("rank");

  // Los roles disponibles salen de los datos, no de una lista fija: filtrar
  // por un rol que nadie juega solo daría una tabla vacía.
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    for (const entry of entries) if (entry.preferredRole) roles.add(entry.preferredRole);
    return Array.from(roles);
  }, [entries]);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = entries.filter((entry) => {
      if (role !== "all" && entry.preferredRole !== role) return false;
      if (!normalizedQuery) return true;
      const name = (entry.profile.display_name ?? entry.profile.riot_game_name).toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        entry.profile.riot_game_name.toLowerCase().includes(normalizedQuery) ||
        entry.topChampions.some((c) => c.championName.toLowerCase().includes(normalizedQuery))
      );
    });

    // El orden por defecto ya viene resuelto desde getLadder (por rankValue);
    // solo se reordena cuando el usuario pide otra cosa.
    if (sort === "rank") return filtered;

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "winrate":
          return (
            winrate(b.snapshot?.wins ?? 0, b.snapshot?.losses ?? 0) -
            winrate(a.snapshot?.wins ?? 0, a.snapshot?.losses ?? 0)
          );
        case "games":
          return b.games - a.games;
        case "streak": {
          // Solo las rachas de victorias puntúan hacia arriba; una racha de
          // derrotas ordena por debajo de "sin racha".
          const score = (entry: LadderEntry) =>
            entry.streak.result === "W" ? entry.streak.count : -entry.streak.count;
          return score(b) - score(a);
        }
        default:
          return 0;
      }
    });
  }, [entries, query, role, sort]);

  const hasFilters = query.trim() !== "" || role !== "all";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador o campeón"
            aria-label="Buscar jugador o campeón"
            className={cn(
              "focus-ring w-full rounded-chip border border-obsidian-700 bg-obsidian-900 py-1.5 pl-9 pr-3",
              "font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus-visible:border-accent"
            )}
          />
        </label>

        {availableRoles.length > 1 && (
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="all">Todos los roles</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </option>
            ))}
          </Select>
        )}

        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Ordenar por"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              Ordenar: {SORT_LABELS[key]}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRole("all");
            }}
            className="focus-ring inline-flex items-center gap-1 rounded-chip px-2 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-ink"
          >
            <X size={12} aria-hidden />
            Limpiar
          </button>
        )}

        <span className="ml-auto font-mono text-xs text-ink-muted tabular">
          {visible.length} de {entries.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="font-display text-lg uppercase tracking-wide text-ink">Sin coincidencias</p>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Ningún jugador coincide con la búsqueda o el filtro de rol.
          </p>
        </Panel>
      ) : (
        <div>
          <LadderHeader />
          <ol className="flex flex-col gap-2">
            {visible.map((entry, index) => (
              <LadderRow
                key={entry.profile.id}
                entry={entry}
                // El número de puesto es siempre la posición real en el ladder,
                // no el índice dentro del resultado filtrado: si se filtra por
                // support, el 1º del ladder tiene que seguir mostrando su puesto.
                rank={
                  sort === "rank"
                    ? entries.findIndex((e) => e.profile.id === entry.profile.id) + 1
                    : index + 1
                }
                version={version}
                seasonId={seasonId}
                live={liveByProfileId[entry.profile.id]}
              />
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
