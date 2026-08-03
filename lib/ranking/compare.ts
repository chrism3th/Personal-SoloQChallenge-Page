import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { buildPlayerPanelData, type PlayerPanelData } from "./panel";

type DB = Database;
type SeasonRow = DB["public"]["Tables"]["seasons"]["Row"];

export type ComparedPlayer = {
  profileId: string;
  slug: string;
  name: string;
  /** Color de tier del jugador, para darle una serie consistente en todo el comparador. */
  glowColor: string | null;
  data: PlayerPanelData;
};

export type ComparisonChartPoint = {
  date: string;
  /** Un campo por jugador, con su slug de clave. */
  [slug: string]: string | number | null;
};

export type Comparison = {
  players: ComparedPlayer[];
  chartData: ComparisonChartPoint[];
  sharedChampions: {
    championName: string;
    championIconUrl: string;
    perPlayer: { slug: string; games: number; wins: number; winrate: number }[];
  }[];
};

/**
 * Compara 2+ jugadores en una misma temporada. Reutiliza buildPlayerPanelData
 * por jugador en vez de duplicar la lógica de agregación, y solo se ocupa de
 * fusionar las series para que el gráfico las pueda pintar juntas.
 */
export async function buildComparison(
  supabase: SupabaseClient<DB>,
  profileIds: string[],
  season: SeasonRow | null
): Promise<Comparison> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", profileIds);

  const players = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const data = await buildPlayerPanelData(supabase, profile, season);
      return {
        profileId: profile.id,
        slug: profile.slug,
        name: profile.display_name ?? profile.riot_game_name,
        glowColor: null,
        data,
      } satisfies ComparedPlayer;
    })
  );

  return {
    players,
    chartData: mergeChartSeries(players),
    sharedChampions: findSharedChampions(players),
  };
}

/**
 * Une las series de LP de varios jugadores en un solo dataset por fecha.
 *
 * Los snapshots de dos jugadores casi nunca caen en el mismo instante, así que
 * cada fecha del eje deja huecos en las demás series. Se rellenan arrastrando
 * el último valor conocido de cada jugador (step-after): la alternativa —
 * dejar null — parte las líneas en segmentos sueltos y el gráfico se vuelve
 * ilegible. Antes del primer snapshot de un jugador sí queda null, porque ahí
 * genuinamente todavía no tenía rango.
 */
function mergeChartSeries(players: ComparedPlayer[]): ComparisonChartPoint[] {
  const allDates = Array.from(
    new Set(players.flatMap((player) => player.data.chartData.map((point) => point.date)))
  ).sort();

  const cursors = new Map<string, number>();
  const lastValues = new Map<string, number | null>();
  for (const player of players) {
    cursors.set(player.slug, 0);
    lastValues.set(player.slug, null);
  }

  return allDates.map((date) => {
    const point: ComparisonChartPoint = { date };
    for (const player of players) {
      const series = player.data.chartData;
      let cursor = cursors.get(player.slug)!;
      while (cursor < series.length && series[cursor].date <= date) {
        lastValues.set(player.slug, series[cursor].value);
        cursor++;
      }
      cursors.set(player.slug, cursor);
      point[player.slug] = lastValues.get(player.slug) ?? null;
    }
    return point;
  });
}

/** Campeones que jugaron todos los comparados — la comparación más directa. */
function findSharedChampions(players: ComparedPlayer[]): Comparison["sharedChampions"] {
  if (players.length < 2) return [];

  const [first, ...rest] = players;
  return first.data.championStats
    .filter((stat) =>
      rest.every((player) =>
        player.data.championStats.some((s) => s.championName === stat.championName)
      )
    )
    .map((stat) => ({
      championName: stat.championName,
      championIconUrl: stat.championIconUrl,
      perPlayer: players.map((player) => {
        const playerStat = player.data.championStats.find(
          (s) => s.championName === stat.championName
        )!;
        return {
          slug: player.slug,
          games: playerStat.games,
          wins: playerStat.wins,
          winrate: Math.round((playerStat.wins / playerStat.games) * 100),
        };
      }),
    }))
    .sort((a, b) => {
      const total = (c: Comparison["sharedChampions"][number]) =>
        c.perPlayer.reduce((sum, p) => sum + p.games, 0);
      return total(b) - total(a);
    });
}
