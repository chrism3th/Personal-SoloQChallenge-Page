import Image from "next/image";
import { Panel } from "@/components/shared/Panel";
import { cn } from "@/lib/utils/cn";
import type { PanelChampionStat } from "@/lib/ranking/panel";

/** Grilla de campeones más jugados — pensada para mostrar el "pool" competitivo del jugador. */
export function TopChampionsGrid({ stats }: { stats: PanelChampionStat[] }) {
  const top = stats.slice(0, 6);
  if (top.length === 0) {
    return (
      <Panel className="p-6">
        <p className="font-body text-sm text-ink-muted">Todavía no hay partidas registradas.</p>
      </Panel>
    );
  }

  return (
    <div>
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Pool de campeones
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {top.map((stat) => {
          const wr = Math.round((stat.wins / stat.games) * 100);
          return (
            <Panel key={stat.championId} className="flex items-center gap-3 p-3">
              <Image
                src={stat.championIconUrl}
                alt={stat.championName}
                width={48}
                height={48}
                unoptimized
                className="shrink-0 rounded-xl border border-obsidian-700"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate font-body text-sm font-semibold text-ink">{stat.championName}</p>
                <p className="font-mono text-[11px] text-ink-muted">
                  {stat.games}j · {stat.avgKills.toFixed(1)}/{stat.avgDeaths.toFixed(1)}/
                  {stat.avgAssists.toFixed(1)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-obsidian-800">
                    <span
                      className={cn("block h-full rounded-full", wr >= 50 ? "bg-win" : "bg-loss")}
                      style={{ width: `${wr}%` }}
                    />
                  </span>
                  <span
                    className={cn("font-mono text-[11px] font-semibold", wr >= 50 ? "text-win" : "text-loss")}
                  >
                    {wr}%
                  </span>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
