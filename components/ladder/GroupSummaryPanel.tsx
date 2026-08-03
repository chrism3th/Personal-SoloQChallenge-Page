import Image from "next/image";
import Link from "next/link";
import { Flame, Gamepad2, Radio, TrendingUp, Users } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { Stat } from "@/components/ui/Stat";
import { championIconUrl } from "@/lib/riot/ddragon";
import type { GroupSummary } from "@/lib/ranking/group-summary";

/**
 * Resumen del grupo. Funciona degradado: con un solo jugador y sin rachas
 * activas sigue mostrando partidas totales y campeón más jugado, y las celdas
 * sin dato dicen "—" en vez de desaparecer y descuadrar la grilla.
 */
export function GroupSummaryPanel({
  summary,
  version,
}: {
  summary: GroupSummary;
  version: string;
}) {
  return (
    <Panel className="grid grid-cols-2 divide-x divide-y divide-obsidian-700 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5">
      <Stat
        label="Jugadores"
        icon={Users}
        numericValue={summary.players}
        detail={summary.livePlayers > 0 ? `${summary.livePlayers} en vivo` : "roster activo"}
      />

      <Stat
        label="Partidas totales"
        icon={Gamepad2}
        numericValue={summary.totalGames}
        detail="esta temporada"
      />

      <Stat
        label="Campeón del grupo"
        icon={Radio}
        compact
        value={
          summary.topChampion ? (
            <span className="flex items-center gap-2">
              <Image
                src={championIconUrl(version, summary.topChampion.championName)}
                alt=""
                width={22}
                height={22}
                unoptimized
                className="rounded-md"
              />
              <span className="truncate">{summary.topChampion.championName}</span>
            </span>
          ) : (
            "—"
          )
        }
        detail={summary.topChampion ? `${summary.topChampion.games}j` : undefined}
      />

      <Stat
        label="Mejor racha activa"
        icon={Flame}
        compact
        valueClassName={summary.bestStreak ? "text-win" : undefined}
        value={
          summary.bestStreak ? (
            <Link
              href={`/jugador/${summary.bestStreak.slug}`}
              className="focus-ring truncate rounded-chip transition-colors hover:text-accent"
            >
              {summary.bestStreak.count}V · {summary.bestStreak.name}
            </Link>
          ) : (
            "—"
          )
        }
        detail={summary.bestStreak ? undefined : "sin rachas de victorias"}
      />

      <Stat
        label="Subió esta semana"
        icon={TrendingUp}
        compact
        valueClassName={summary.biggestClimb ? "text-win" : undefined}
        value={
          summary.biggestClimb ? (
            <Link
              href={`/jugador/${summary.biggestClimb.slug}`}
              className="focus-ring truncate rounded-chip transition-colors hover:text-accent"
            >
              +{summary.biggestClimb.delta} · {summary.biggestClimb.name}
            </Link>
          ) : (
            "—"
          )
        }
        detail={summary.biggestClimb ? "puntos de rango" : "sin movimiento"}
      />
    </Panel>
  );
}
