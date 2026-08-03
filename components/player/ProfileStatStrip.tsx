import { Panel } from "@/components/shared/Panel";
import { cn } from "@/lib/utils/cn";
import type { PlayerPanelData } from "@/lib/ranking/panel";

function StatTile({
  label,
  value,
  detail,
  valueClassName,
  compact = false,
}: {
  label: string;
  value: string;
  detail?: string;
  valueClassName?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
      <span
        className={cn(
          "font-display leading-none text-ink",
          compact ? "text-lg" : "text-2xl",
          valueClassName
        )}
      >
        {value}
      </span>
      {detail && <span className="font-mono text-[11px] text-ink-muted">{detail}</span>}
    </div>
  );
}

/** Franja de KPIs competitivos — siempre visible, tanto en el panel inline del ladder como en /jugador/[handle]. */
export function ProfileStatStrip({ data }: { data: PlayerPanelData }) {
  const wr =
    data.latestSnapshot && data.latestSnapshot.wins + data.latestSnapshot.losses > 0
      ? Math.round(
          (data.latestSnapshot.wins / (data.latestSnapshot.wins + data.latestSnapshot.losses)) * 100
        )
      : null;

  return (
    <Panel className="grid grid-cols-2 divide-x divide-y divide-obsidian-700 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-6">
      <StatTile
        label="Ladder"
        value={data.ladderRank ? `#${data.ladderRank}` : "—"}
        detail={data.ladderRank ? `de ${data.ladderSize}` : undefined}
        valueClassName="text-accent"
      />
      <StatTile
        label="Récord"
        value={data.latestSnapshot ? `${data.latestSnapshot.wins}V ${data.latestSnapshot.losses}D` : "—"}
        detail={wr != null ? `${wr}% WR` : undefined}
      />
      <StatTile
        label="Racha actual"
        value={data.streak.result ? `${data.streak.count}${data.streak.result}` : "—"}
        detail={data.bestWinStreak > 0 ? `mejor: ${data.bestWinStreak}V` : undefined}
        valueClassName={
          data.streak.result === "W" ? "text-win" : data.streak.result === "L" ? "text-loss" : undefined
        }
      />
      <StatTile label="Pico de temporada" value={data.peakRank?.label ?? "—"} compact />
      <StatTile
        label="KDA promedio"
        value={data.kdaAverage ? data.kdaAverage.ratio.toFixed(2) : "—"}
        detail={
          data.kdaAverage
            ? `${data.kdaAverage.kills.toFixed(1)}/${data.kdaAverage.deaths.toFixed(1)}/${data.kdaAverage.assists.toFixed(1)}`
            : undefined
        }
      />
      <StatTile label="Partidas" value={String(data.totalGames)} detail="esta temporada" />
    </Panel>
  );
}
