"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Bar } from "@/components/ui/Bar";
import { winrate } from "@/lib/ranking/lp-math";
import type { PanelChampionStat } from "@/lib/ranking/panel";
import { cn } from "@/lib/utils/cn";

type SortKey = "games" | "winrate" | "kda" | "cs" | "kp";

const COLUMNS: { key: SortKey | null; label: string; align?: "right" }[] = [
  { key: null, label: "Campeón" },
  { key: "games", label: "Partidas" },
  { key: null, label: "V/D" },
  { key: "winrate", label: "WR" },
  { key: "kda", label: "KDA" },
  { key: "cs", label: "CS" },
  { key: "kp", label: "KP" },
];

function kdaRatio(stat: PanelChampionStat): number {
  return stat.avgDeaths === 0
    ? stat.avgKills + stat.avgAssists
    : (stat.avgKills + stat.avgAssists) / stat.avgDeaths;
}

/**
 * Tabla de campeones, ordenable por columna y con el desglose V/D como barra.
 *
 * Nota de semántica: el contenido del campeón va envuelto en un `<div>` dentro
 * del `<td>` — antes el propio `<td>` llevaba `className="flex"`, lo que
 * rompe el modelo de tabla (una celda con `display:flex` deja de comportarse
 * como celda y desalinea la columna).
 */
export function ChampionStatsTable({ stats }: { stats: PanelChampionStat[] }) {
  const [sort, setSort] = useState<SortKey>("games");

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      switch (sort) {
        case "winrate":
          return winrate(b.wins, b.losses) - winrate(a.wins, a.losses);
        case "kda":
          return kdaRatio(b) - kdaRatio(a);
        case "cs":
          return b.avgCs - a.avgCs;
        case "kp":
          return (b.avgKillParticipation ?? 0) - (a.avgKillParticipation ?? 0);
        default:
          return b.games - a.games;
      }
    });
  }, [stats, sort]);

  if (stats.length === 0) {
    return (
      <div className="panel p-6">
        <p className="mb-2 font-body text-xs uppercase tracking-widest text-ink-muted">Campeones</p>
        <p className="font-body text-sm text-ink-muted">Todavía no hay partidas registradas.</p>
      </div>
    );
  }

  const totalGames = stats.reduce((sum, s) => sum + s.games, 0);

  return (
    <div className="panel p-6">
      <p className="mb-4 font-body text-xs uppercase tracking-widest text-ink-muted">Campeones</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-obsidian-700 text-left text-ink-muted">
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={cn(
                    "py-2 pr-4 font-body text-xs uppercase tracking-widest",
                    column.align === "right" && "text-right"
                  )}
                  aria-sort={
                    column.key == null
                      ? undefined
                      : sort === column.key
                        ? "descending"
                        : "none"
                  }
                >
                  {column.key ? (
                    <button
                      type="button"
                      onClick={() => setSort(column.key!)}
                      className={cn(
                        "focus-ring inline-flex items-center gap-1 rounded-chip transition-colors hover:text-ink",
                        sort === column.key && "text-accent"
                      )}
                    >
                      {column.label}
                      {sort === column.key && <ChevronDown size={11} aria-hidden />}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sorted.slice(0, 10).map((stat) => {
              const wr = winrate(stat.wins, stat.losses);
              return (
                <tr
                  key={stat.championId}
                  className="border-b border-obsidian-800 transition-colors hover:bg-obsidian-800/40"
                >
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src={stat.championIconUrl}
                        alt=""
                        width={24}
                        height={24}
                        unoptimized
                        className="shrink-0 rounded-md"
                      />
                      <span className="truncate">{stat.championName}</span>
                    </div>
                  </td>

                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="tabular">{stat.games}</span>
                      <span className="text-[11px] text-ink-muted tabular">
                        {Math.round((stat.games / totalGames) * 100)}%
                      </span>
                    </div>
                  </td>

                  <td className="py-2 pr-4">
                    <div className="flex min-w-[6rem] flex-col gap-1">
                      <span className="text-[11px] text-ink-muted tabular">
                        {stat.wins}V {stat.losses}D
                      </span>
                      <Bar
                        size="xs"
                        ariaLabel={`${stat.wins} victorias, ${stat.losses} derrotas`}
                        segments={[
                          { value: stat.wins, color: "var(--color-win)" },
                          { value: stat.losses, color: "var(--color-loss)" },
                        ]}
                      />
                    </div>
                  </td>

                  <td className={cn("py-2 pr-4 tabular", wr >= 50 ? "text-win" : "text-loss")}>
                    {wr}%
                  </td>

                  <td className="py-2 pr-4">
                    <div className="flex flex-col">
                      <span className="tabular">{kdaRatio(stat).toFixed(2)}</span>
                      <span className="text-[11px] text-ink-muted tabular">
                        {stat.avgKills.toFixed(1)}/{stat.avgDeaths.toFixed(1)}/
                        {stat.avgAssists.toFixed(1)}
                      </span>
                    </div>
                  </td>

                  <td className="py-2 pr-4 tabular text-cyan">{stat.avgCs.toFixed(0)}</td>

                  <td className="py-2 pr-4 tabular text-ink-muted">
                    {stat.avgKillParticipation != null
                      ? `${Math.round(stat.avgKillParticipation * 100)}%`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
