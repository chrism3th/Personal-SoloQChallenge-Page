import Image from "next/image";
import { Panel } from "@/components/shared/Panel";
import { Bar } from "@/components/ui/Bar";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { championSplashUrl } from "@/lib/riot/ddragon";
import { winrate } from "@/lib/ranking/lp-math";
import { cn } from "@/lib/utils/cn";
import type { PanelChampionStat } from "@/lib/ranking/panel";

/** Grilla de campeones más jugados — el "pool" competitivo del jugador. */
export function TopChampionsGrid({ stats }: { stats: PanelChampionStat[] }) {
  const top = stats.slice(0, 6);
  if (top.length === 0) {
    return (
      <Panel className="p-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-muted">
          Pool de campeones
        </p>
        <p className="font-body text-sm text-ink-muted">Todavía no hay partidas registradas.</p>
      </Panel>
    );
  }

  return (
    <div>
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Pool de campeones
      </p>
      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {top.map((stat) => {
          const wr = winrate(stat.wins, stat.losses);
          return (
            <StaggerItem key={stat.championId}>
              <Panel className="relative flex h-full items-center gap-3 overflow-hidden p-3">
                {/* Splash del campeón como textura de fondo de su propia tarjeta. */}
                <div className="splash-veil pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden>
                  <Image
                    src={championSplashUrl(stat.championName)}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 20rem, 100vw"
                    className="object-cover object-[center_22%]"
                  />
                </div>

                <Image
                  src={stat.championIconUrl}
                  alt={stat.championName}
                  width={48}
                  height={48}
                  unoptimized
                  className="relative shrink-0 rounded-xl border border-obsidian-700"
                />

                <div className="relative flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate font-body text-sm font-semibold text-ink">
                    {stat.championName}
                  </p>
                  <p className="font-mono text-[11px] text-ink-muted tabular">
                    {stat.games}j · {stat.avgKills.toFixed(1)}/{stat.avgDeaths.toFixed(1)}/
                    {stat.avgAssists.toFixed(1)} · {stat.avgCs.toFixed(0)} CS
                  </p>
                  <div className="flex items-center gap-2">
                    <Bar
                      size="xs"
                      className="flex-1"
                      ariaLabel={`${stat.championName}: ${stat.wins} victorias de ${stat.games}`}
                      segments={[
                        { value: stat.wins, color: "var(--color-win)" },
                        { value: stat.losses, color: "var(--color-loss)" },
                      ]}
                    />
                    <span
                      className={cn(
                        "font-mono text-[11px] font-semibold tabular",
                        wr >= 50 ? "text-win" : "text-loss"
                      )}
                    >
                      {wr}%
                    </span>
                  </div>
                </div>
              </Panel>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
