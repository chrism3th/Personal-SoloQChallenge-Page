import Image from "next/image";
import type { PanelChampionStat } from "@/lib/ranking/panel";
import { cn } from "@/lib/utils/cn";

export function ChampionStatsTable({ stats }: { stats: PanelChampionStat[] }) {
  if (stats.length === 0) {
    return (
      <div className="panel p-6">
        <p className="font-body text-sm text-ink-muted">Todavía no hay partidas registradas.</p>
      </div>
    );
  }

  const totalGames = stats.reduce((sum, s) => sum + s.games, 0);

  return (
    <div className="panel overflow-x-auto p-6">
      <p className="mb-4 font-body text-xs uppercase tracking-widest text-ink-muted">
        Campeones
      </p>
      <table className="w-full min-w-[420px] border-collapse font-mono text-sm">
        <thead>
          <tr className="border-b border-obsidian-700 text-left text-ink-muted">
            <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">Campeón</th>
            <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">Partidas</th>
            <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">Pick %</th>
            <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">WR</th>
            <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">KDA</th>
          </tr>
        </thead>
        <tbody>
          {stats.slice(0, 10).map((stat) => (
            <tr key={stat.championId} className="border-b border-obsidian-800">
              <td className="flex items-center gap-2 py-2 pr-4">
                <Image
                  src={stat.championIconUrl}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized
                  className="rounded-md"
                />
                {stat.championName}
              </td>
              <td className="py-2 pr-4">{stat.games}</td>
              <td className="py-2 pr-4">{Math.round((stat.games / totalGames) * 100)}%</td>
              <td
                className={cn(
                  "py-2 pr-4",
                  stat.wins >= stat.losses ? "text-win" : "text-loss"
                )}
              >
                {Math.round((stat.wins / stat.games) * 100)}%
              </td>
              <td className="py-2 pr-4">
                {stat.avgKills.toFixed(1)}/{stat.avgDeaths.toFixed(1)}/
                {stat.avgAssists.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
