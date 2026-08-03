/**
 * Datos falsos en memoria para /dev/preview.
 *
 * NO tocan la base: son objetos literales que se le pasan directo a los
 * componentes. Existen porque varias superficies del sitio (podio de tres,
 * ladder poblado, progresión de LP cruzando tiers, temporada cerrada con
 * resultados) no se pueden ver con los datos reales, y revisar el rediseño a
 * ciegas no es revisar nada.
 *
 * Distinto de scripts/seed-fake-data.ts, que sí escribe en una instancia local
 * de Supabase. Acá no hay escritura de ningún tipo.
 */
import type { PanelChampionStat, PanelMatchRow, PlayerPanelData } from "@/lib/ranking/panel";
import type { PodiumEntry } from "@/lib/ranking/public-summary";
import type { LadderEntry } from "@/lib/ranking/season-scope";
import type { FinalStanding } from "@/lib/ranking/hall-of-fame";
import type { GroupSummary } from "@/lib/ranking/group-summary";
import type { Database, Division, Tier } from "@/lib/supabase/types";
import { rankValue } from "@/lib/ranking/lp-math";
import { computeStreak } from "@/lib/ranking/streak";
import { championIconUrl } from "@/lib/riot/ddragon";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type LpSnapshotRow = Database["public"]["Tables"]["lp_snapshots"]["Row"];

/** Versión fija: /dev/preview no debe depender de la red para renderizar. */
export const FIXTURE_VERSION = "15.1.1";

const CHAMPIONS = [
  "Ahri",
  "Yasuo",
  "Thresh",
  "LeeSin",
  "Jinx",
  "Darius",
  "Lux",
  "Ezreal",
  "Sett",
];

const PLAYERS: {
  name: string;
  tier: Tier;
  division: Division;
  lp: number;
  wins: number;
  losses: number;
  role: string;
  live?: boolean;
}[] = [
  { name: "Yeji", tier: "DIAMOND", division: "II", lp: 74, wins: 92, losses: 71, role: "MIDDLE", live: true },
  { name: "Rulo", tier: "DIAMOND", division: "IV", lp: 31, wins: 61, losses: 52, role: "JUNGLE" },
  { name: "Kuma", tier: "EMERALD", division: "I", lp: 88, wins: 74, losses: 66, role: "BOTTOM" },
  { name: "Vera", tier: "EMERALD", division: "III", lp: 12, wins: 40, losses: 38, role: "UTILITY", live: true },
  { name: "Nico", tier: "PLATINUM", division: "I", lp: 55, wins: 33, losses: 29, role: "TOP" },
  { name: "Tobi", tier: "PLATINUM", division: "IV", lp: 40, wins: 25, losses: 30, role: "MIDDLE" },
  { name: "Sol", tier: "GOLD", division: "II", lp: 67, wins: 18, losses: 22, role: "JUNGLE" },
  { name: "Mika", tier: "GOLD", division: "IV", lp: 9, wins: 11, losses: 16, role: "UTILITY" },
  { name: "Ash", tier: "SILVER", division: "I", lp: 21, wins: 6, losses: 9, role: "BOTTOM" },
];

function makeProfile(name: string, index: number): ProfileRow {
  return {
    id: `fixture-${index}`,
    riot_puuid: `puuid-${index}`,
    riot_game_name: name,
    riot_tag_line: "LAS",
    slug: name.toLowerCase(),
    summoner_id: null,
    profile_icon_id: 4000 + index,
    display_name: name,
    is_admin: false,
    is_active: true,
    last_polled_at: null,
    created_at: "2025-01-01T00:00:00.000Z",
  };
}

function makeSnapshot(
  profileId: string,
  index: number,
  tier: Tier,
  division: Division,
  lp: number,
  wins: number,
  losses: number
): LpSnapshotRow {
  return {
    id: index,
    profile_id: profileId,
    queue_type: "RANKED_SOLO_5x5",
    tier,
    division,
    league_points: lp,
    wins,
    losses,
    taken_at: "2025-06-01T12:00:00.000Z",
  };
}

/** Forma reciente determinista: sin Math.random, para que las capturas sean estables. */
function makeForm(seed: number): boolean[] {
  return Array.from({ length: 5 }, (_, i) => (seed + i) % 3 !== 0);
}

export function makeLadderEntries(count = PLAYERS.length): LadderEntry[] {
  return PLAYERS.slice(0, count).map((player, index) => {
    const profile = makeProfile(player.name, index);
    const snapshot = makeSnapshot(
      profile.id,
      index,
      player.tier,
      player.division,
      player.lp,
      player.wins,
      player.losses
    );

    return {
      profile,
      snapshot,
      rankValue: rankValue(player.tier, player.division, player.lp),
      isLive: player.live ?? false,
      liveChampionId: player.live ? 103 : null,
      liveGameStartTime: player.live ? new Date(Date.now() - 14 * 60_000).toISOString() : null,
      recentForm: makeForm(index),
      topChampions: [
        { championName: CHAMPIONS[index % CHAMPIONS.length], games: 24 - index, wins: 14 - index },
        { championName: CHAMPIONS[(index + 3) % CHAMPIONS.length], games: 15 - index, wins: 7 },
        { championName: CHAMPIONS[(index + 6) % CHAMPIONS.length], games: 9, wins: 5 },
      ],
      preferredRole: player.role,
      lastGameLpDelta: index % 3 === 0 ? 18 : index % 3 === 1 ? -16 : null,
      // Coherente con recentForm: la racha se cuenta desde la partida más
      // reciente, así el preview no muestra "7V" al lado de una derrota.
      streak: computeStreak(makeForm(index).map((win) => ({ win }))),
      games: player.wins + player.losses,
      lastGameAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
    };
  });
}

/** Ladder con un solo jugador y sin partidas: el estado real de la base hoy. */
export function makeSingleLadderEntry(): LadderEntry[] {
  const entries = makeLadderEntries(1);
  return [{ ...entries[0], topChampions: [], recentForm: [], streak: { result: null, count: 0 } }];
}

export function makePodiumEntries(count = 3): PodiumEntry[] {
  return makeLadderEntries(count).map((entry) => ({
    id: entry.profile.id,
    slug: entry.profile.slug,
    name: entry.profile.display_name ?? entry.profile.riot_game_name,
    isLive: entry.isLive,
    tier: entry.snapshot?.tier ?? null,
    division: entry.snapshot?.division ?? null,
    leaguePoints: entry.snapshot?.league_points ?? null,
    wins: entry.snapshot?.wins ?? 0,
    losses: entry.snapshot?.losses ?? 0,
    games: entry.games,
    recentForm: entry.recentForm,
    streak: entry.streak,
    preferredRole: entry.preferredRole,
    topChampion: entry.topChampions[0] ?? null,
  }));
}

export const FIXTURE_GROUP_SUMMARY: GroupSummary = {
  players: 9,
  totalGames: 742,
  livePlayers: 2,
  topChampion: { championName: "Ahri", games: 96 },
  bestStreak: { name: "Yeji", slug: "yeji", count: 7 },
  biggestClimb: { name: "Kuma", slug: "kuma", delta: 214 },
};

/** Resumen degradado: un jugador, sin rachas ni movimiento. */
export const FIXTURE_GROUP_SUMMARY_EMPTY: GroupSummary = {
  players: 1,
  totalGames: 20,
  livePlayers: 0,
  topChampion: { championName: "Ahri", games: 6 },
  bestStreak: null,
  biggestClimb: null,
};

/**
 * 30 puntos de LP que cruzan de Platinum a Diamond, para ver las bandas de
 * tier del gráfico haciendo su trabajo (con una sola banda no se distinguen
 * de un fondo cualquiera).
 */
export function makeChartData(): PlayerPanelData["chartData"] {
  const steps: { tier: Tier; division: Division; lp: number }[] = [];
  const ladder: [Tier, Division][] = [
    ["PLATINUM", "II"],
    ["PLATINUM", "I"],
    ["EMERALD", "IV"],
    ["EMERALD", "III"],
    ["EMERALD", "II"],
    ["EMERALD", "I"],
    ["DIAMOND", "IV"],
    ["DIAMOND", "III"],
  ];

  for (let i = 0; i < 30; i++) {
    const [tier, division] = ladder[Math.min(ladder.length - 1, Math.floor(i / 4))];
    steps.push({ tier, division, lp: (i * 37) % 100 });
  }

  return steps.map((step, i) => ({
    date: new Date(Date.UTC(2025, 4, 1 + i, 12)).toISOString(),
    value: rankValue(step.tier, step.division, step.lp),
    label: `${step.tier}${step.division ? " " + step.division : ""} · ${step.lp} LP`,
  }));
}

function makeChampionStats(): PanelChampionStat[] {
  return CHAMPIONS.slice(0, 7).map((championName, index) => {
    const games = 28 - index * 3;
    const wins = Math.round(games * (0.62 - index * 0.04));
    return {
      championId: 100 + index,
      championName,
      games,
      wins,
      losses: games - wins,
      avgKills: 8.4 - index * 0.5,
      avgDeaths: 4.1 + index * 0.3,
      avgAssists: 7.2 - index * 0.4,
      avgCs: 198 - index * 12,
      avgKillParticipation: index === 6 ? null : 0.58 - index * 0.03,
      championIconUrl: championIconUrl(FIXTURE_VERSION, championName),
    };
  });
}

function makeMatchHistory(): PanelMatchRow[] {
  return Array.from({ length: 12 }, (_, i) => {
    const championName = CHAMPIONS[i % CHAMPIONS.length];
    const duration = 1500 + i * 60;
    const cs = 180 + i * 6;
    return {
      matchId: `LA1_${1000 + i}`,
      win: i % 3 !== 1,
      gameCreation: new Date(Date.now() - (i + 1) * 7_200_000).toISOString(),
      gameDuration: duration,
      role: PLAYERS[i % PLAYERS.length].role,
      championName,
      championIconUrl: championIconUrl(FIXTURE_VERSION, championName),
      kills: 6 + (i % 7),
      deaths: 2 + (i % 5),
      assists: 8 + (i % 6),
      cs,
      csPerMin: cs / (duration / 60),
      visionScore: 18 + (i % 12),
      killParticipation: 0.45 + (i % 5) * 0.06,
      opponentChampionName: CHAMPIONS[(i + 4) % CHAMPIONS.length],
      opponentChampionIconUrl: championIconUrl(
        FIXTURE_VERSION,
        CHAMPIONS[(i + 4) % CHAMPIONS.length]
      ),
      spell1IconUrl: null,
      spell2IconUrl: null,
      keystoneIconUrl: null,
      subTreeIconUrl: null,
      itemIconUrls: Array.from({ length: 7 }, () => null),
      lpDelta: i % 4 === 3 ? null : i % 3 !== 1 ? 19 : -17,
    };
  });
}

export function makePanelData(
  overrides: Partial<PlayerPanelData> = {}
): PlayerPanelData {
  const championStats = makeChampionStats();
  const matchHistory = makeMatchHistory();
  const chartData = makeChartData();

  return {
    profile: {
      slug: "yeji",
      displayName: "Yeji",
      riotGameName: "Yeji",
      riotTagLine: "LAS",
      profileIconUrl: null,
    },
    season: { id: "fixture-season", name: "S1 · Temporada de prueba" },
    latestSnapshot: {
      tier: "DIAMOND",
      division: "III",
      leaguePoints: 62,
      wins: 92,
      losses: 71,
    },
    sparklineValues: chartData.slice(-15).map((point) => point.value),
    streak: { result: "W", count: 4 },
    bestWinStreak: 7,
    totalGames: 163,
    seasonRecord: { wins: 92, losses: 71 },
    kdaAverage: { kills: 7.8, deaths: 4.4, assists: 8.1, ratio: 3.61 },
    avgCsPerMin: 7.4,
    avgVisionScore: 26,
    ladderRank: 1,
    ladderSize: 9,
    peakRank: {
      tier: "DIAMOND",
      division: "II",
      leaguePoints: 88,
      label: "Diamond II · 88 LP",
      date: "2025-05-24T12:00:00.000Z",
    },
    chartData,
    matchHistory,
    championStats,
    roleStats: [
      { role: "MIDDLE", games: 88, wins: 52 },
      { role: "JUNGLE", games: 41, wins: 19 },
      { role: "BOTTOM", games: 22, wins: 13 },
      { role: "TOP", games: 12, wins: 5 },
    ],
    ...overrides,
  };
}

export function makeStandings(count = 5): FinalStanding[] {
  return PLAYERS.slice(0, count).map((player, index) => ({
    finalRank: index + 1,
    profile: {
      id: `fixture-${index}`,
      slug: player.name.toLowerCase(),
      name: player.name,
    },
    tier: player.tier,
    division: player.division,
    leaguePoints: player.lp,
    wins: player.wins,
    losses: player.losses,
  }));
}
