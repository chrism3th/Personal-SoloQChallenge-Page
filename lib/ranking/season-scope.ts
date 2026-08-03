import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { computeMatchLpDeltas, rankValue as computeRankValue } from "./lp-math";
import { computeStreak, type Streak } from "./streak";

// Debe mantenerse en sync con RANKED_SOLO_QUEUE_ID en lib/riot/match.ts —
// duplicado a propósito para no acoplar esta capa de queries a lib/riot/
// (server-only, trae el cliente Riot/zod). La ingesta ya restringe a solo
// queue; este filtro es defensa en profundidad a nivel de query.
const RANKED_SOLO_QUEUE_ID = 420;
const RANKED_SOLO_QUEUE_TYPE = "RANKED_SOLO_5x5";

type DB = Database;
type SeasonRow = DB["public"]["Tables"]["seasons"]["Row"];
type ProfileRow = DB["public"]["Tables"]["profiles"]["Row"];
type LpSnapshotRow = DB["public"]["Tables"]["lp_snapshots"]["Row"];

export type LadderEntry = {
  profile: ProfileRow;
  snapshot: LpSnapshotRow | null;
  rankValue: number;
  isLive: boolean;
  /** Campeón e inicio de la partida en curso — solo cuando `isLive`. */
  liveChampionId: number | null;
  liveGameStartTime: string | null;
  recentForm: boolean[];
  topChampions: { championName: string; games: number; wins: number }[];
  preferredRole: string | null;
  lastGameLpDelta: number | null;
  streak: Streak;
  games: number;
  lastGameAt: string | null;
};

export async function getCurrentSeason(
  supabase: SupabaseClient<DB>
): Promise<SeasonRow | null> {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();
  return data ?? null;
}

export async function getSeasonById(
  supabase: SupabaseClient<DB>,
  seasonId: string
): Promise<SeasonRow | null> {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", seasonId)
    .maybeSingle();
  return data ?? null;
}

export async function listSeasons(
  supabase: SupabaseClient<DB>
): Promise<SeasonRow[]> {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .order("starts_at", { ascending: false });
  return data ?? [];
}

/** IDs de los perfiles que el admin armó como roster de una temporada. */
export async function getSeasonParticipantIds(
  supabase: SupabaseClient<DB>,
  seasonId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("season_participants")
    .select("profile_id")
    .eq("season_id", seasonId);
  return (data ?? []).map((r) => r.profile_id);
}

const RECENT_FORM_SIZE = 5;
const TOP_CHAMPIONS_SIZE = 3;

type EmbeddedMatch<T = object> = (T & { game_creation: string }) | (T & { game_creation: string })[] | null;

function normalizeEmbeddedMatch<T>(matches: EmbeddedMatch<T>): (T & { game_creation: string }) | null {
  if (Array.isArray(matches)) return matches[0] ?? null;
  return matches;
}

export type LadderExtras = {
  recentForm: boolean[];
  topChampions: { championName: string; games: number; wins: number }[];
  preferredRole: string | null;
  lastGameLpDelta: number | null;
  streak: Streak;
  games: number;
  lastGameAt: string | null;
};

/**
 * Datos derivados del historial de partidas de cada perfil dentro de una
 * temporada (forma reciente, campeones más jugados, rol preferido, LP de la
 * última partida) — todo en una sola query batcheada (no una por perfil),
 * usado para densificar cada fila del ladder.
 *
 * El orden por columna de una tabla embebida (`.order(col, { foreignTable })`)
 * no es confiable en todas las versiones de PostgREST — en local (14.15) se
 * verificó que el parámetro que genera postgrest-js (`matches.order=`) es
 * ignorado silenciosamente, devolviendo las filas en un orden arbitrario. Se
 * trae todo lo del rango sin depender del order de la DB y se ordena en JS,
 * que es la única forma de garantizar "más reciente primero" sin atarse a la
 * versión de PostgREST del entorno.
 */
async function getLadderExtras(
  supabase: SupabaseClient<DB>,
  profileIds: string[],
  season: SeasonRow | null,
  snapshotsAscByProfile: Map<string, LpSnapshotRow[]>
): Promise<Map<string, LadderExtras>> {
  const result = new Map<string, LadderExtras>();
  if (profileIds.length === 0) return result;

  let query = supabase
    .from("match_participants")
    .select("profile_id, win, champion_name, role, matches!inner(id, game_creation, queue_id)")
    .in("profile_id", profileIds)
    .eq("matches.queue_id", RANKED_SOLO_QUEUE_ID);

  if (season) {
    query = query
      .gte("matches.game_creation", season.starts_at)
      .lte("matches.game_creation", season.ends_at ?? new Date().toISOString());
  }

  const { data } = await query;

  type Row = {
    profile_id: string;
    win: boolean;
    champion_name: string;
    role: string | null;
    matches: EmbeddedMatch<{ id: string }>;
  };

  const byProfile = new Map<
    string,
    { win: boolean; championName: string; role: string | null; matchId: string; gameCreation: string }[]
  >();
  for (const row of (data ?? []) as Row[]) {
    const match = normalizeEmbeddedMatch(row.matches);
    if (!match) continue;
    const list = byProfile.get(row.profile_id) ?? [];
    list.push({
      win: row.win,
      championName: row.champion_name,
      role: row.role,
      matchId: match.id,
      gameCreation: match.game_creation,
    });
    byProfile.set(row.profile_id, list);
  }

  for (const [profileId, list] of byProfile) {
    list.sort((a, b) => b.gameCreation.localeCompare(a.gameCreation));

    const recentForm = list.slice(0, RECENT_FORM_SIZE).map((m) => m.win);

    const championTotals = new Map<string, { games: number; wins: number }>();
    const roleGames = new Map<string, number>();
    for (const m of list) {
      const champion = championTotals.get(m.championName) ?? { games: 0, wins: 0 };
      champion.games += 1;
      if (m.win) champion.wins += 1;
      championTotals.set(m.championName, champion);
      if (m.role) roleGames.set(m.role, (roleGames.get(m.role) ?? 0) + 1);
    }
    const topChampions = Array.from(championTotals.entries())
      .map(([championName, totals]) => ({ championName, ...totals }))
      .sort((a, b) => b.games - a.games)
      .slice(0, TOP_CHAMPIONS_SIZE);
    const preferredRole = Array.from(roleGames.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const lpDeltas = computeMatchLpDeltas(
      list.map((m) => ({ id: m.matchId, gameCreation: m.gameCreation })),
      (snapshotsAscByProfile.get(profileId) ?? []).map((s) => ({
        takenAt: s.taken_at,
        tier: s.tier,
        division: s.division,
        leaguePoints: s.league_points,
      }))
    );
    const lastGameLpDelta = list.length > 0 ? (lpDeltas.get(list[0].matchId) ?? null) : null;

    result.set(profileId, {
      recentForm,
      topChampions,
      preferredRole,
      lastGameLpDelta,
      // `list` ya quedó ordenada de más reciente a más antigua arriba, que es
      // exactamente lo que computeStreak espera.
      streak: computeStreak(list.map((m) => ({ win: m.win }))),
      games: list.length,
      lastGameAt: list[0]?.gameCreation ?? null,
    });
  }

  return result;
}

/**
 * Ranking de una temporada = último lp_snapshot de cada jugador dentro del
 * rango [starts_at, ends_at ?? ahora]. Es el rango vigente del jugador
 * durante ese periodo, no un delta de progreso acumulado (ver nota en el
 * plan). `season = null` da el ladder permanente (sin acotar por fecha).
 */
export async function getLadder(
  supabase: SupabaseClient<DB>,
  season: SeasonRow | null
): Promise<LadderEntry[]> {
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true);

  // El ladder de una temporada solo muestra el roster que el admin armó
  // para ese torneo (season_participants) — no todos los perfiles activos.
  // `season = null` (ladder histórico/permanente) no tiene roster propio,
  // así que ahí sí se muestran todos los activos.
  let profiles = allProfiles ?? [];
  if (season) {
    const rosterIds = new Set(await getSeasonParticipantIds(supabase, season.id));
    profiles = profiles.filter((p) => rosterIds.has(p.id));
  }

  if (profiles.length === 0) return [];

  let snapshotQuery = supabase
    .from("lp_snapshots")
    .select("*")
    .eq("queue_type", RANKED_SOLO_QUEUE_TYPE)
    .order("taken_at", { ascending: false });

  if (season) {
    snapshotQuery = snapshotQuery
      .gte("taken_at", season.starts_at)
      .lte("taken_at", season.ends_at ?? new Date().toISOString());
  }

  const { data: snapshots } = await snapshotQuery;

  // snapshots viene ordenado desc por fecha: la primera aparición de cada
  // profile_id es su snapshot más reciente dentro del rango.
  const latestByProfile = new Map<string, LpSnapshotRow>();
  const snapshotsAscByProfile = new Map<string, LpSnapshotRow[]>();
  for (const snap of snapshots ?? []) {
    if (!latestByProfile.has(snap.profile_id)) {
      latestByProfile.set(snap.profile_id, snap);
    }
    const list = snapshotsAscByProfile.get(snap.profile_id) ?? [];
    list.push(snap);
    snapshotsAscByProfile.set(snap.profile_id, list);
  }
  // cada lista quedó en orden desc (mismo orden que `snapshots`) — se
  // invierte una vez acá para que computeMatchLpDeltas reciba ascendente.
  for (const list of snapshotsAscByProfile.values()) list.reverse();

  // champion_id y game_start_time los puebla el cron de spectator y hasta
  // ahora no se leían: son los que permiten decir "en vivo con Ahri hace 12
  // min" en vez de solo "en vivo".
  const { data: liveRows } = await supabase
    .from("live_status")
    .select("profile_id, is_live, champion_id, game_start_time");
  const liveByProfile = new Map(
    (liveRows ?? []).filter((row) => row.is_live).map((row) => [row.profile_id, row])
  );

  const extrasByProfile = await getLadderExtras(
    supabase,
    profiles.map((p) => p.id),
    season,
    snapshotsAscByProfile
  );

  const entries: LadderEntry[] = profiles.map((profile) => {
    const snapshot = latestByProfile.get(profile.id) ?? null;
    const extras = extrasByProfile.get(profile.id);
    const live = liveByProfile.get(profile.id) ?? null;
    return {
      profile,
      snapshot,
      rankValue: snapshot
        ? computeRankValue(snapshot.tier, snapshot.division, snapshot.league_points)
        : -1,
      isLive: live != null,
      liveChampionId: live?.champion_id ?? null,
      liveGameStartTime: live?.game_start_time ?? null,
      recentForm: extras?.recentForm ?? [],
      topChampions: extras?.topChampions ?? [],
      preferredRole: extras?.preferredRole ?? null,
      lastGameLpDelta: extras?.lastGameLpDelta ?? null,
      streak: extras?.streak ?? { result: null, count: 0 },
      games: extras?.games ?? 0,
      lastGameAt: extras?.lastGameAt ?? null,
    };
  });

  entries.sort((a, b) => b.rankValue - a.rankValue);
  return entries;
}

export type ChampionStat = {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  losses: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCs: number;
  /** Fracción 0-1, o null si ninguna partida del campeón la trae poblada. */
  avgKillParticipation: number | null;
};

/** Estadísticas por campeón de un jugador, acotadas a una temporada (o al histórico completo si season es null). */
export async function getChampionStats(
  supabase: SupabaseClient<DB>,
  profileId: string,
  season: SeasonRow | null
): Promise<ChampionStat[]> {
  let query = supabase
    .from("match_participants")
    .select(
      "champion_id, champion_name, win, kills, deaths, assists, cs, kill_participation, matches!inner(game_creation, queue_id)"
    )
    .eq("profile_id", profileId)
    .eq("matches.queue_id", RANKED_SOLO_QUEUE_ID);

  if (season) {
    query = query
      .gte("matches.game_creation", season.starts_at)
      .lte("matches.game_creation", season.ends_at ?? new Date().toISOString());
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as {
    champion_id: number;
    champion_name: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    kill_participation: number | null;
  }[];

  // Se acumulan totales y se divide al final (en vez de ir recalculando el
  // promedio en cada fila), porque kill_participation es nullable y necesita
  // su propio contador: promediarla sobre partidas que no la traen la
  // subestimaría.
  type Totals = {
    championId: number;
    championName: string;
    games: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    killParticipation: number;
    killParticipationGames: number;
  };

  const byChampion = new Map<number, Totals>();
  for (const row of rows) {
    const totals = byChampion.get(row.champion_id) ?? {
      championId: row.champion_id,
      championName: row.champion_name,
      games: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      cs: 0,
      killParticipation: 0,
      killParticipationGames: 0,
    };
    totals.games += 1;
    totals.wins += row.win ? 1 : 0;
    totals.losses += row.win ? 0 : 1;
    totals.kills += row.kills;
    totals.deaths += row.deaths;
    totals.assists += row.assists;
    totals.cs += row.cs;
    if (row.kill_participation != null) {
      totals.killParticipation += row.kill_participation;
      totals.killParticipationGames += 1;
    }
    byChampion.set(row.champion_id, totals);
  }

  return Array.from(byChampion.values())
    .map(
      (t): ChampionStat => ({
        championId: t.championId,
        championName: t.championName,
        games: t.games,
        wins: t.wins,
        losses: t.losses,
        avgKills: t.kills / t.games,
        avgDeaths: t.deaths / t.games,
        avgAssists: t.assists / t.games,
        avgCs: t.cs / t.games,
        avgKillParticipation:
          t.killParticipationGames > 0 ? t.killParticipation / t.killParticipationGames : null,
      })
    )
    .sort((a, b) => b.games - a.games);
}

/** Últimas N partidas de un jugador dentro de una temporada, más reciente primero (o de todo el histórico si season es null). */
export async function getMatchHistory(
  supabase: SupabaseClient<DB>,
  profileId: string,
  season: SeasonRow | null,
  limit = 20
) {
  let query = supabase
    .from("match_participants")
    .select(
      `champion_id, champion_name, win, kills, deaths, assists, role, cs, vision_score,
       summoner_spell1_id, summoner_spell2_id, primary_rune_id, primary_rune_style_id, sub_rune_style_id,
       item0, item1, item2, item3, item4, item5, item6,
       kill_participation, opponent_champion_id, opponent_champion_name,
       matches!inner(id, game_creation, game_duration, queue_id)`
    )
    .eq("profile_id", profileId)
    .eq("matches.queue_id", RANKED_SOLO_QUEUE_ID);

  if (season) {
    query = query
      .gte("matches.game_creation", season.starts_at)
      .lte("matches.game_creation", season.ends_at ?? new Date().toISOString());
  }

  // Sin .order()/.limit() a nivel de DB a propósito — ver el comentario en
  // getRecentForm sobre por qué ordenar una tabla embebida (`matches`) no es
  // confiable acá. Se trae todo el rango y se ordena/recorta en JS.
  const { data } = await query;
  const rows = data ?? [];
  const matchDate = (row: (typeof rows)[number]) =>
    normalizeEmbeddedMatch((row as { matches: EmbeddedMatch }).matches)?.game_creation ?? "";
  rows.sort((a, b) => matchDate(b).localeCompare(matchDate(a)));
  return rows.slice(0, limit);
}

/** Snapshots de LP de un jugador dentro de una temporada, ascendente por fecha (o de todo el histórico si season es null). */
export async function getSeasonSnapshots(
  supabase: SupabaseClient<DB>,
  profileId: string,
  season: SeasonRow | null
): Promise<LpSnapshotRow[]> {
  let query = supabase
    .from("lp_snapshots")
    .select("*")
    .eq("profile_id", profileId)
    .eq("queue_type", RANKED_SOLO_QUEUE_TYPE)
    .order("taken_at", { ascending: true });

  if (season) {
    query = query
      .gte("taken_at", season.starts_at)
      .lte("taken_at", season.ends_at ?? new Date().toISOString());
  }

  const { data } = await query;
  return data ?? [];
}
