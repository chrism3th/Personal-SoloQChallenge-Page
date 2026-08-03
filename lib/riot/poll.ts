import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getSummonerByPuuid } from "./summoner";
import { getLeagueEntriesByPuuid, getSoloQueueEntry } from "./league";
import { getRankedMatchIds, getMatchDetail } from "./match";
import { getActiveGameByPuuid } from "./spectator";

type DB = Database;
type ProfileRow = DB["public"]["Tables"]["profiles"]["Row"];

export type PollResult = {
  profileId: string;
  snapshotInserted: boolean;
  newMatches: number;
  error?: string;
};

const MASTER_PLUS_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/**
 * Actualiza el snapshot de LP/rango y las partidas ranked nuevas de un
 * perfil. Compartido entre el cron (api/cron/poll-matches) y el poll
 * inicial disparado justo después del registro, para que el jugador no
 * aparezca vacío en el ladder hasta el próximo ciclo.
 */
export async function pollProfileMatches(
  supabase: SupabaseClient<DB>,
  profile: ProfileRow
): Promise<PollResult> {
  let snapshotInserted = false;
  let newMatches = 0;

  try {
    // Best-effort: solo para el ícono de invocador, nunca bloquea el
    // resto del poll si falla (ej. rate limit puntual). El rango se pide
    // directo por PUUID más abajo, sin depender de este resultado.
    if (!profile.profile_icon_id) {
      try {
        const summoner = await getSummonerByPuuid(profile.riot_puuid);
        await supabase
          .from("profiles")
          .update({ profile_icon_id: summoner.profileIconId })
          .eq("id", profile.id);
      } catch (iconErr) {
        console.error("pollProfileMatches: no se pudo obtener el ícono", profile.id, iconErr);
      }
    }

    const entries = await getLeagueEntriesByPuuid(profile.riot_puuid);
    const solo = getSoloQueueEntry(entries);

    if (solo) {
      const { data: lastSnapshot } = await supabase
        .from("lp_snapshots")
        .select("tier, division, league_points, wins, losses")
        .eq("profile_id", profile.id)
        .order("taken_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const division = MASTER_PLUS_TIERS.has(solo.tier) ? null : solo.rank ?? null;

      const changed =
        !lastSnapshot ||
        lastSnapshot.tier !== solo.tier ||
        lastSnapshot.division !== division ||
        lastSnapshot.league_points !== solo.leaguePoints ||
        lastSnapshot.wins !== solo.wins ||
        lastSnapshot.losses !== solo.losses;

      if (changed) {
        await supabase.from("lp_snapshots").insert({
          profile_id: profile.id,
          tier: solo.tier,
          division,
          league_points: solo.leaguePoints,
          wins: solo.wins,
          losses: solo.losses,
        });
        snapshotInserted = true;
      }
    }

    const since = profile.last_polled_at ? new Date(profile.last_polled_at).getTime() : undefined;
    const matchIds = await getRankedMatchIds(profile.riot_puuid, {
      startTime: since ? Math.floor(since / 1000) : undefined,
      count: 20,
    });

    for (const matchId of matchIds) {
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("id", matchId)
        .maybeSingle();
      if (existingMatch) continue;

      const detail = await getMatchDetail(matchId);
      await supabase.from("matches").insert({
        id: detail.metadata.matchId,
        game_creation: new Date(detail.info.gameCreation).toISOString(),
        game_duration: detail.info.gameDuration,
        queue_id: detail.info.queueId,
        patch_version: detail.info.gameVersion,
        raw: detail,
      });

      const participant = detail.info.participants.find((p) => p.puuid === profile.riot_puuid);
      if (participant) {
        // Rival de línea: mismo teamPosition, equipo contrario.
        const opponent = detail.info.participants.find(
          (p) =>
            p.teamPosition &&
            p.teamPosition === participant.teamPosition &&
            p.teamId !== participant.teamId
        );

        // perks.styles[0] es siempre el árbol primario, [1] el secundario
        // (así lo entrega Riot, marcado por su propio campo `description`).
        const primaryStyle = participant.perks?.styles[0];
        const subStyle = participant.perks?.styles[1];

        await supabase.from("match_participants").insert({
          match_id: detail.metadata.matchId,
          profile_id: profile.id,
          puuid: profile.riot_puuid,
          champion_id: participant.championId,
          champion_name: participant.championName,
          role: participant.teamPosition ?? null,
          team_position: participant.teamPosition ?? null,
          win: participant.win,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          cs: participant.totalMinionsKilled + (participant.neutralMinionsKilled ?? 0),
          vision_score: participant.visionScore ?? null,
          summoner_spell1_id: participant.summoner1Id ?? null,
          summoner_spell2_id: participant.summoner2Id ?? null,
          primary_rune_id: primaryStyle?.selections[0]?.perk ?? null,
          primary_rune_style_id: primaryStyle?.style ?? null,
          sub_rune_style_id: subStyle?.style ?? null,
          item0: participant.item0 ?? null,
          item1: participant.item1 ?? null,
          item2: participant.item2 ?? null,
          item3: participant.item3 ?? null,
          item4: participant.item4 ?? null,
          item5: participant.item5 ?? null,
          item6: participant.item6 ?? null,
          kill_participation: participant.challenges?.killParticipation ?? null,
          opponent_champion_id: opponent?.championId ?? null,
          opponent_champion_name: opponent?.championName ?? null,
        });
        newMatches++;
      }
    }

    await supabase
      .from("profiles")
      .update({ last_polled_at: new Date().toISOString() })
      .eq("id", profile.id);

    return { profileId: profile.id, snapshotInserted, newMatches };
  } catch (err) {
    return {
      profileId: profile.id,
      snapshotInserted,
      newMatches,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Actualiza el indicador "en partida ahora" de un perfil. */
export async function pollProfileLiveStatus(
  supabase: SupabaseClient<DB>,
  profile: ProfileRow
): Promise<void> {
  const activeGame = await getActiveGameByPuuid(profile.riot_puuid);
  await supabase.from("live_status").upsert({
    profile_id: profile.id,
    is_live: Boolean(activeGame),
    game_mode: activeGame?.gameMode ?? null,
    game_start_time: activeGame ? new Date(activeGame.gameStartTime).toISOString() : null,
    champion_id:
      activeGame?.participants.find((p) => p.puuid === profile.riot_puuid)?.championId ?? null,
    checked_at: new Date().toISOString(),
  });
}
