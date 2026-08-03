import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tier, Division } from "@/lib/supabase/types";
import { getCurrentSeason, getLadder } from "./season-scope";

export type PodiumEntry = {
  id: string;
  slug: string;
  name: string;
  isLive: boolean;
  tier: Tier | null;
  division: Division;
  leaguePoints: number | null;
};

export type PublicPodium = {
  seasonName: string | null;
  entries: PodiumEntry[];
};

/**
 * Resumen público del podio para la portada — a diferencia del resto del
 * sitio (protegido por sesión + RLS), esto se sirve con el cliente admin
 * para no depender de login, y solo expone lo mínimo que pinta el podio
 * (nada de riot_puuid/riot_tag_line/summoner_id).
 */
export async function getPublicPodium(limit = 3): Promise<PublicPodium> {
  const admin = createAdminClient();
  const season = await getCurrentSeason(admin);
  const ladder = await getLadder(admin, season);

  const entries = ladder.slice(0, limit).map((entry) => ({
    id: entry.profile.id,
    slug: entry.profile.slug,
    name: entry.profile.display_name ?? entry.profile.riot_game_name,
    isLive: entry.isLive,
    tier: entry.snapshot?.tier ?? null,
    division: entry.snapshot?.division ?? null,
    leaguePoints: entry.snapshot?.league_points ?? null,
  }));

  return { seasonName: season?.name ?? null, entries };
}
