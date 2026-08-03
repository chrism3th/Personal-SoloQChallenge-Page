import {
  Crosshair,
  Eye,
  Flame,
  Gamepad2,
  Mountain,
  Sprout,
  Trophy,
} from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { Stat } from "@/components/ui/Stat";
import { LpSparkline } from "./LpSparkline";
import { formatOrdinal } from "@/lib/utils/format";
import { winrate } from "@/lib/ranking/lp-math";
import type { PlayerPanelData } from "@/lib/ranking/panel";

/**
 * Franja de KPIs competitivos, visible tanto en el panel inline del ladder
 * como en /jugador/[handle].
 *
 * El winrate sale de `seasonRecord` (partidas de la temporada) y no de
 * `latestSnapshot`, que es el acumulado de por vida que reporta Riot: mezclar
 * ambos hacía que el porcentaje no cuadrara con el historial de abajo.
 */
export function ProfileStatStrip({ data }: { data: PlayerPanelData }) {
  const { seasonRecord } = data;
  const seasonGames = seasonRecord.wins + seasonRecord.losses;
  const wr = seasonGames > 0 ? winrate(seasonRecord.wins, seasonRecord.losses) : null;

  return (
    <Panel className="grid grid-cols-2 divide-x divide-y divide-obsidian-700 sm:grid-cols-4 sm:divide-y-0 lg:grid-cols-7">
      <Stat
        label="Ladder"
        icon={Trophy}
        value={data.ladderRank ? formatOrdinal(data.ladderRank) : "—"}
        detail={data.ladderRank ? `de ${data.ladderSize}` : undefined}
        valueClassName="text-accent"
      />

      <Stat
        label="Récord"
        icon={Gamepad2}
        value={seasonGames > 0 ? `${seasonRecord.wins}V ${seasonRecord.losses}D` : "—"}
        detail={wr != null ? `${wr}% WR` : undefined}
      />

      <Stat
        label="Racha actual"
        icon={Flame}
        value={data.streak.result ? `${data.streak.count}${data.streak.result}` : "—"}
        detail={data.bestWinStreak > 0 ? `mejor: ${data.bestWinStreak}V` : undefined}
        valueClassName={
          data.streak.result === "W"
            ? "text-win"
            : data.streak.result === "L"
              ? "text-loss"
              : undefined
        }
      />

      <Stat
        label="Pico de temporada"
        icon={Mountain}
        value={data.peakRank?.label ?? "—"}
        detail={
          data.peakRank
            ? new Date(data.peakRank.date).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "short",
              })
            : undefined
        }
        compact
      />

      <Stat
        label="KDA promedio"
        icon={Crosshair}
        value={data.kdaAverage ? data.kdaAverage.ratio.toFixed(2) : "—"}
        detail={
          data.kdaAverage
            ? `${data.kdaAverage.kills.toFixed(1)}/${data.kdaAverage.deaths.toFixed(1)}/${data.kdaAverage.assists.toFixed(1)}`
            : undefined
        }
      />

      <Stat
        label="CS por minuto"
        icon={Sprout}
        value={data.avgCsPerMin != null ? data.avgCsPerMin.toFixed(1) : "—"}
        detail={data.avgVisionScore != null ? undefined : "sin datos de farmeo"}
        valueClassName="text-cyan"
      />

      <Stat
        label="Visión"
        icon={Eye}
        value={data.avgVisionScore != null ? data.avgVisionScore.toFixed(0) : "—"}
        detail={
          data.sparklineValues.length >= 2 ? (
            <LpSparkline values={data.sparklineValues} width={72} height={20} />
          ) : (
            `${data.totalGames} partidas`
          )
        }
        valueClassName="text-cyan"
      />
    </Panel>
  );
}
