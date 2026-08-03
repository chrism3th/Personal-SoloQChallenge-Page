import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { rankValue } from "./lp-math";
import type { LadderEntry } from "./season-scope";

type DB = Database;
type SeasonRow = DB["public"]["Tables"]["seasons"]["Row"];

const RANKED_SOLO_QUEUE_TYPE = "RANKED_SOLO_5x5";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type GroupSummary = {
  players: number;
  totalGames: number;
  livePlayers: number;
  topChampion: { championName: string; games: number } | null;
  bestStreak: { name: string; slug: string; count: number } | null;
  biggestClimb: { name: string; slug: string; delta: number } | null;
};

/**
 * Resumen del grupo para la portada y el ladder. Todo salvo "quién más subió"
 * se agrega sobre los LadderEntry que la página ya cargó — no hay queries
 * nuevas por jugador.
 */
export async function buildGroupSummary(
  supabase: SupabaseClient<DB>,
  entries: LadderEntry[],
  season: SeasonRow | null
): Promise<GroupSummary> {
  const championGames = new Map<string, number>();
  for (const entry of entries) {
    for (const champion of entry.topChampions) {
      championGames.set(
        champion.championName,
        (championGames.get(champion.championName) ?? 0) + champion.games
      );
    }
  }
  const topChampionEntry = Array.from(championGames.entries()).sort((a, b) => b[1] - a[1])[0];

  // Solo rachas de victorias activas: una racha de derrotas no es un logro
  // que destacar en el resumen del grupo.
  const bestStreakEntry = entries
    .filter((entry) => entry.streak.result === "W" && entry.streak.count > 0)
    .sort((a, b) => b.streak.count - a.streak.count)[0];

  return {
    players: entries.length,
    totalGames: entries.reduce((sum, entry) => sum + entry.games, 0),
    livePlayers: entries.filter((entry) => entry.isLive).length,
    topChampion: topChampionEntry
      ? { championName: topChampionEntry[0], games: topChampionEntry[1] }
      : null,
    bestStreak: bestStreakEntry
      ? {
          name: bestStreakEntry.profile.display_name ?? bestStreakEntry.profile.riot_game_name,
          slug: bestStreakEntry.profile.slug,
          count: bestStreakEntry.streak.count,
        }
      : null,
    biggestClimb: await computeBiggestClimb(supabase, entries, season),
  };
}

/**
 * Quién más subió en los últimos 7 días, comparando su snapshot más antiguo
 * de la ventana contra el más reciente. Una sola query para todo el grupo.
 */
async function computeBiggestClimb(
  supabase: SupabaseClient<DB>,
  entries: LadderEntry[],
  season: SeasonRow | null
): Promise<GroupSummary["biggestClimb"]> {
  if (entries.length === 0) return null;

  const profileIds = entries.map((entry) => entry.profile.id);
  // La ventana nunca empieza antes del inicio de la temporada: si no, el
  // "subió esta semana" de una temporada recién arrancada arrastraría LP
  // ganado antes de que empezara.
  const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();
  const since = season && season.starts_at > weekAgo ? season.starts_at : weekAgo;

  const { data: snapshots } = await supabase
    .from("lp_snapshots")
    .select("profile_id, tier, division, league_points, taken_at")
    .in("profile_id", profileIds)
    .eq("queue_type", RANKED_SOLO_QUEUE_TYPE)
    .gte("taken_at", since)
    .order("taken_at", { ascending: true });

  const byProfile = new Map<string, { first: number; last: number }>();
  for (const snap of snapshots ?? []) {
    const value = rankValue(snap.tier, snap.division, snap.league_points);
    const existing = byProfile.get(snap.profile_id);
    // Vienen ascendentes por fecha: el primero que se ve es el más antiguo.
    if (!existing) byProfile.set(snap.profile_id, { first: value, last: value });
    else existing.last = value;
  }

  const entryById = new Map(entries.map((entry) => [entry.profile.id, entry]));
  let best: { name: string; slug: string; delta: number } | null = null;
  for (const [profileId, { first, last }] of byProfile) {
    const delta = last - first;
    if (delta <= 0) continue;
    const entry = entryById.get(profileId);
    if (!entry) continue;
    if (!best || delta > best.delta) {
      best = {
        name: entry.profile.display_name ?? entry.profile.riot_game_name,
        slug: entry.profile.slug,
        delta,
      };
    }
  }

  return best;
}
