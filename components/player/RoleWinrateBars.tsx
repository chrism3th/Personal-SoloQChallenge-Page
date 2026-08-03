import { Panel } from "@/components/shared/Panel";
import { RoleIcon } from "@/components/ladder/RoleIcon";
import { ROLE_LABELS } from "@/lib/riot/roles";

type RoleStat = { role: string; games: number; wins: number };

export function RoleWinrateBars({ stats }: { stats: RoleStat[] }) {
  if (stats.length === 0) return null;
  const maxGames = Math.max(...stats.map((s) => s.games));

  return (
    <Panel className="p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Distribución de roles
      </p>
      <div className="flex flex-col gap-3">
        {stats.map((stat) => {
          const wr = Math.round((stat.wins / stat.games) * 100);
          return (
            <div key={stat.role} className="flex items-center gap-3">
              <span className="flex w-24 shrink-0 items-center gap-1.5">
                <RoleIcon role={stat.role} showLabel={false} />
                <span className="font-body text-sm text-ink-muted">
                  {ROLE_LABELS[stat.role] ?? stat.role}
                </span>
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-obsidian-800">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(stat.games / maxGames) * 100}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right font-mono text-xs text-ink-muted">
                {stat.games}j · {wr}% WR
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
