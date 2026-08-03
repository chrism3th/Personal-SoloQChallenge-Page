import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Division, Tier } from "@/lib/supabase/types";
import {
  getChampionStats,
  getLadder,
  getMatchHistory,
  getSeasonSnapshots,
  type ChampionStat,
} from "./season-scope";
import { computeBestWinStreak, computeStreak, type Streak } from "./streak";
import { computeMatchLpDeltas, formatTierDivision, rankValue } from "./lp-math";
import {
  championIconUrl,
  getLatestDdragonVersion,
  itemIconUrl,
  profileIconUrl,
  runeIconUrl,
  summonerSpellIconUrl,
} from "@/lib/riot/ddragon";

type DB = Database;
type SeasonRow = DB["public"]["Tables"]["seasons"]["Row"];
type ProfileRow = DB["public"]["Tables"]["profiles"]["Row"];

export type PanelMatchRow = {
  matchId: string;
  win: boolean;
  gameCreation: string;
  gameDuration: number;
  role: string | null;
  championName: string;
  championIconUrl: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  killParticipation: number | null;
  opponentChampionName: string | null;
  opponentChampionIconUrl: string | null;
  spell1IconUrl: string | null;
  spell2IconUrl: string | null;
  keystoneIconUrl: string | null;
  subTreeIconUrl: string | null;
  itemIconUrls: (string | null)[];
  lpDelta: number | null;
};

export type PanelChampionStat = ChampionStat & { championIconUrl: string };

export type PlayerPanelData = {
  profile: {
    slug: string;
    displayName: string | null;
    riotGameName: string;
    riotTagLine: string;
    profileIconUrl: string | null;
  };
  season: { id: string; name: string } | null;
  latestSnapshot: {
    tier: Tier;
    division: Division;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
  sparklineValues: number[];
  streak: Streak;
  bestWinStreak: number;
  totalGames: number;
  kdaAverage: { kills: number; deaths: number; assists: number; ratio: number } | null;
  ladderRank: number | null;
  ladderSize: number;
  peakRank: { tier: Tier; division: Division; leaguePoints: number; label: string } | null;
  chartData: { date: string; value: number; label: string }[];
  matchHistory: PanelMatchRow[];
  championStats: PanelChampionStat[];
  roleStats: { role: string; games: number; wins: number }[];
};

/**
 * Arma toda la data del panel de jugador (header, gráfico de LP, historial
 * de partidas con íconos ya resueltos, stats por campeón y por rol) en un
 * solo lugar, para que la fila expandible del ladder y /jugador/[handle]
 * consuman exactamente lo mismo vía la API route de panel.
 */
export async function buildPlayerPanelData(
  supabase: SupabaseClient<DB>,
  profile: ProfileRow,
  season: SeasonRow | null
): Promise<PlayerPanelData> {
  const version = await getLatestDdragonVersion();

  const snapshots = await getSeasonSnapshots(supabase, profile.id, season);
  // Se trae todo el historial de la temporada (tope generoso, no artificial
  // de "últimas 15") para que racha, roles, KDA promedio y mejor racha sean
  // reales de la temporada completa — no solo de una muestra reciente. Solo
  // se resuelven íconos (caro, un fetch por partida) para el subconjunto que
  // realmente se muestra en el historial.
  const [championStatsRaw, matchHistoryFullRaw, ladderEntries] = await Promise.all([
    getChampionStats(supabase, profile.id, season),
    getMatchHistory(supabase, profile.id, season, 1000),
    getLadder(supabase, season),
  ]);

  const chartData = snapshots.map((s) => ({
    date: s.taken_at,
    value: rankValue(s.tier, s.division, s.league_points),
    label: `${s.tier}${s.division ? " " + s.division : ""} · ${s.league_points} LP`,
  }));
  const sparklineValues = chartData.slice(-15).map((point) => point.value);
  const latestSnapshotRow = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const peakSnapshot = snapshots.reduce<(typeof snapshots)[number] | null>((best, s) => {
    if (!best) return s;
    return rankValue(s.tier, s.division, s.league_points) >
      rankValue(best.tier, best.division, best.league_points)
      ? s
      : best;
  }, null);

  const ladderIndex = ladderEntries.findIndex((e) => e.profile.id === profile.id);

  // El embed de Supabase para una relación N:1 puede tipar `matches` como
  // objeto único o array de un elemento según el caso — se normaliza acá.
  const normalizedMatchesFull = matchHistoryFullRaw.map((row) => ({
    ...row,
    matches: Array.isArray(row.matches) ? (row.matches[0] ?? null) : row.matches,
  }));
  const normalizedMatches = normalizedMatchesFull.slice(0, 20);

  const streak = computeStreak(normalizedMatchesFull.map((m) => ({ win: m.win })));
  const bestWinStreak = computeBestWinStreak(normalizedMatchesFull.map((m) => ({ win: m.win })));
  const totalGames = normalizedMatchesFull.length;
  const kdaAverage =
    totalGames > 0
      ? (() => {
          const totals = normalizedMatchesFull.reduce(
            (acc, m) => ({
              kills: acc.kills + m.kills,
              deaths: acc.deaths + m.deaths,
              assists: acc.assists + m.assists,
            }),
            { kills: 0, deaths: 0, assists: 0 }
          );
          const avgKills = totals.kills / totalGames;
          const avgDeaths = totals.deaths / totalGames;
          const avgAssists = totals.assists / totalGames;
          return {
            kills: avgKills,
            deaths: avgDeaths,
            assists: avgAssists,
            ratio: avgDeaths === 0 ? avgKills + avgAssists : (avgKills + avgAssists) / avgDeaths,
          };
        })()
      : null;

  const lpDeltas = computeMatchLpDeltas(
    normalizedMatches
      .filter((m) => m.matches)
      .map((m) => ({ id: m.matches!.id, gameCreation: m.matches!.game_creation })),
    snapshots.map((s) => ({
      takenAt: s.taken_at,
      tier: s.tier,
      division: s.division,
      leaguePoints: s.league_points,
    }))
  );

  const roleTotals = new Map<string, { games: number; wins: number }>();
  for (const match of normalizedMatchesFull) {
    if (!match.role) continue;
    const current = roleTotals.get(match.role) ?? { games: 0, wins: 0 };
    current.games += 1;
    if (match.win) current.wins += 1;
    roleTotals.set(match.role, current);
  }
  const roleStats = Array.from(roleTotals.entries())
    .map(([role, stat]) => ({ role, ...stat }))
    .sort((a, b) => b.games - a.games);

  const matchHistory: PanelMatchRow[] = await Promise.all(
    normalizedMatches.map(async (m) => {
      const [spell1, spell2, keystone, subTree] = await Promise.all([
        summonerSpellIconUrl(version, m.summoner_spell1_id),
        summonerSpellIconUrl(version, m.summoner_spell2_id),
        runeIconUrl(version, m.primary_rune_id),
        runeIconUrl(version, m.sub_rune_style_id),
      ]);

      return {
        matchId: m.matches?.id ?? "",
        win: m.win,
        gameCreation: m.matches?.game_creation ?? "",
        gameDuration: m.matches?.game_duration ?? 0,
        role: m.role,
        championName: m.champion_name,
        championIconUrl: championIconUrl(version, m.champion_name),
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
        cs: m.cs,
        killParticipation: m.kill_participation,
        opponentChampionName: m.opponent_champion_name,
        opponentChampionIconUrl: m.opponent_champion_name
          ? championIconUrl(version, m.opponent_champion_name)
          : null,
        spell1IconUrl: spell1,
        spell2IconUrl: spell2,
        keystoneIconUrl: keystone,
        subTreeIconUrl: subTree,
        itemIconUrls: [m.item0, m.item1, m.item2, m.item3, m.item4, m.item5, m.item6].map(
          (id) => (id ? itemIconUrl(version, id) : null)
        ),
        lpDelta: m.matches ? lpDeltas.get(m.matches.id) ?? null : null,
      };
    })
  );

  const championStats: PanelChampionStat[] = championStatsRaw.map((stat) => ({
    ...stat,
    championIconUrl: championIconUrl(version, stat.championName),
  }));

  return {
    profile: {
      slug: profile.slug,
      displayName: profile.display_name,
      riotGameName: profile.riot_game_name,
      riotTagLine: profile.riot_tag_line,
      profileIconUrl: profile.profile_icon_id
        ? profileIconUrl(version, profile.profile_icon_id)
        : null,
    },
    season: season ? { id: season.id, name: season.name } : null,
    latestSnapshot: latestSnapshotRow
      ? {
          tier: latestSnapshotRow.tier,
          division: latestSnapshotRow.division,
          leaguePoints: latestSnapshotRow.league_points,
          wins: latestSnapshotRow.wins,
          losses: latestSnapshotRow.losses,
        }
      : null,
    sparklineValues,
    streak,
    bestWinStreak,
    totalGames,
    kdaAverage,
    ladderRank: ladderIndex >= 0 ? ladderIndex + 1 : null,
    ladderSize: ladderEntries.length,
    peakRank: peakSnapshot
      ? {
          tier: peakSnapshot.tier,
          division: peakSnapshot.division,
          leaguePoints: peakSnapshot.league_points,
          label: `${formatTierDivision(peakSnapshot.tier, peakSnapshot.division)} · ${peakSnapshot.league_points} LP`,
        }
      : null,
    chartData,
    matchHistory,
    championStats,
    roleStats,
  };
}
