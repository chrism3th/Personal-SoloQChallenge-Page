import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Division, Tier } from "@/lib/supabase/types";
import { getLadder, listSeasons } from "./season-scope";

type DB = Database;
type SeasonRow = DB["public"]["Tables"]["seasons"]["Row"];

export type FinalStanding = {
  finalRank: number;
  profile: { id: string; slug: string; name: string } | null;
  tier: Tier;
  division: Division;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type SeasonStandings = {
  season: SeasonRow;
  standings: FinalStanding[];
  /**
   * `stored` = viene de season_results (la temporada pasó por close_season()).
   * `derived` = se reconstruyó desde los snapshots del rango de la temporada.
   * La UI lo muestra, porque una clasificación derivada puede moverse si
   * después entran snapshots atrasados, y la almacenada no.
   */
  source: "stored" | "derived";
};

/**
 * Clasificación final almacenada de una temporada. `season_results` guarda
 * wins/losses desde siempre y hasta ahora nadie los leía.
 */
export async function getStoredSeasonResults(
  supabase: SupabaseClient<DB>,
  seasonId: string
): Promise<FinalStanding[]> {
  const { data: results } = await supabase
    .from("season_results")
    .select("*")
    .eq("season_id", seasonId)
    .order("final_rank", { ascending: true });

  if (!results || results.length === 0) return [];

  const profileIds = results.map((r) => r.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, slug, display_name, riot_game_name")
    .in("id", profileIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return results.map((result) => {
    const profile = profileById.get(result.profile_id);
    return {
      finalRank: result.final_rank,
      profile: profile
        ? {
            id: profile.id,
            slug: profile.slug,
            name: profile.display_name ?? profile.riot_game_name,
          }
        : null,
      tier: result.tier,
      division: result.division,
      leaguePoints: result.league_points,
      wins: result.wins,
      losses: result.losses,
    };
  });
}

/**
 * Clasificación de una temporada cerrada, con reconstrucción de respaldo.
 *
 * Una temporada puede estar marcada como cerrada sin haber pasado nunca por
 * `close_season()` (por ejemplo si se cerró editando la fila a mano), y en ese
 * caso `season_results` queda vacío y el salón de la fama la mostraría como si
 * no hubiera pasado nada. Cuando no hay filas almacenadas se deriva la tabla
 * desde `getLadder(season)`, que ya devuelve el último snapshot de cada
 * jugador dentro del rango de fechas de la temporada — que es exactamente la
 * definición de clasificación final. Es solo lectura: no escribe la tabla.
 */
export async function getSeasonStandings(
  supabase: SupabaseClient<DB>,
  season: SeasonRow
): Promise<SeasonStandings> {
  const stored = await getStoredSeasonResults(supabase, season.id);
  if (stored.length > 0) return { season, standings: stored, source: "stored" };

  const ladder = await getLadder(supabase, season);
  const standings = ladder
    .filter((entry) => entry.snapshot != null)
    .map((entry, index) => ({
      finalRank: index + 1,
      profile: {
        id: entry.profile.id,
        slug: entry.profile.slug,
        name: entry.profile.display_name ?? entry.profile.riot_game_name,
      },
      tier: entry.snapshot!.tier,
      division: entry.snapshot!.division,
      leaguePoints: entry.snapshot!.league_points,
      wins: entry.snapshot!.wins,
      losses: entry.snapshot!.losses,
    }));

  return { season, standings, source: "derived" };
}

/** Todas las temporadas cerradas con su clasificación, más reciente primero. */
export async function listHallOfFame(
  supabase: SupabaseClient<DB>
): Promise<SeasonStandings[]> {
  const seasons = await listSeasons(supabase);
  const closed = seasons.filter((season) => season.is_closed);
  return Promise.all(closed.map((season) => getSeasonStandings(supabase, season)));
}
