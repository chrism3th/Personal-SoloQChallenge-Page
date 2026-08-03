import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { MatchSchema, type RiotMatchParticipant } from "@/lib/riot/match";
import { championIconUrl, getLatestDdragonVersion, itemIconUrl } from "@/lib/riot/ddragon";

type DB = Database;

const ROLE_ORDER: Record<string, number> = {
  TOP: 0,
  JUNGLE: 1,
  MIDDLE: 2,
  BOTTOM: 3,
  UTILITY: 4,
};

export type ScoreboardParticipant = {
  puuid: string;
  riotName: string;
  role: string | null;
  championName: string;
  championIconUrl: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  goldEarned: number | null;
  damageDealt: number | null;
  damageTaken: number | null;
  visionScore: number | null;
  itemIconUrls: (string | null)[];
  profile: { slug: string; displayName: string | null } | null;
};

export type ScoreboardTeam = {
  teamId: number;
  win: boolean;
  kills: number;
  goldEarned: number;
  participants: ScoreboardParticipant[];
};

export type MatchScoreboard = {
  matchId: string;
  gameCreation: string;
  gameDuration: number;
  maxGoldEarned: number;
  maxDamageDealt: number;
  teams: ScoreboardTeam[];
};

/**
 * Parsea matches.raw (guardado desde lib/riot/poll.ts) y arma el scoreboard
 * de los 10 jugadores, cruzando puuid contra profiles para linkear a los
 * que sí están en el ladder. Devuelve null si raw no está poblado (partida
 * ingerida antes de este cambio) o si el JSON guardado no matchea el schema.
 */
export async function buildMatchScoreboard(
  supabase: SupabaseClient<DB>,
  matchRow: { id: string; game_creation: string; game_duration: number; raw: unknown }
): Promise<MatchScoreboard | null> {
  if (!matchRow.raw) return null;

  const parsed = MatchSchema.safeParse(matchRow.raw);
  if (!parsed.success) return null;

  const version = await getLatestDdragonVersion();
  const puuids = parsed.data.info.participants.map((p) => p.puuid);
  const { data: trackedProfiles } = await supabase
    .from("profiles")
    .select("slug, display_name, riot_puuid")
    .in("riot_puuid", puuids);
  const byPuuid = new Map((trackedProfiles ?? []).map((p) => [p.riot_puuid, p]));

  const toParticipant = (p: RiotMatchParticipant): ScoreboardParticipant => {
    const tracked = byPuuid.get(p.puuid);
    return {
      puuid: p.puuid,
      riotName: p.riotIdGameName
        ? `${p.riotIdGameName}#${p.riotIdTagline ?? ""}`
        : (tracked?.display_name ?? "Jugador"),
      role: p.teamPosition || null,
      championName: p.championName,
      championIconUrl: championIconUrl(version, p.championName),
      win: p.win,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs: p.totalMinionsKilled + (p.neutralMinionsKilled ?? 0),
      goldEarned: p.goldEarned ?? null,
      damageDealt: p.totalDamageDealtToChampions ?? null,
      damageTaken: p.totalDamageTaken ?? null,
      visionScore: p.visionScore ?? null,
      itemIconUrls: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((id) =>
        id ? itemIconUrl(version, id) : null
      ),
      profile: tracked ? { slug: tracked.slug, displayName: tracked.display_name } : null,
    };
  };

  const allParticipants = parsed.data.info.participants.map(toParticipant);
  const maxGoldEarned = Math.max(1, ...allParticipants.map((p) => p.goldEarned ?? 0));
  const maxDamageDealt = Math.max(1, ...allParticipants.map((p) => p.damageDealt ?? 0));

  const teamIds = Array.from(new Set(parsed.data.info.participants.map((p) => p.teamId))).sort(
    (a, b) => a - b
  );

  const teams: ScoreboardTeam[] = teamIds.map((teamId) => {
    const rawTeamParticipants = parsed.data.info.participants.filter((p) => p.teamId === teamId);
    const participants = rawTeamParticipants
      .map(toParticipant)
      .sort((a, b) => (ROLE_ORDER[a.role ?? ""] ?? 99) - (ROLE_ORDER[b.role ?? ""] ?? 99));
    return {
      teamId,
      win: participants[0]?.win ?? false,
      kills: participants.reduce((sum, p) => sum + p.kills, 0),
      goldEarned: participants.reduce((sum, p) => sum + (p.goldEarned ?? 0), 0),
      participants,
    };
  });

  return {
    matchId: matchRow.id,
    gameCreation: matchRow.game_creation,
    gameDuration: matchRow.game_duration,
    maxGoldEarned,
    maxDamageDealt,
    teams,
  };
}
