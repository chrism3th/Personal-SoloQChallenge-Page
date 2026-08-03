import "server-only";
import { z } from "zod";
import { riot } from "./client";

const RANKED_SOLO_QUEUE_ID = 420;

export async function getRankedMatchIds(
  puuid: string,
  opts: { startTime?: number; start?: number; count?: number } = {}
): Promise<string[]> {
  const params = new URLSearchParams({
    queue: String(RANKED_SOLO_QUEUE_ID),
    start: String(opts.start ?? 0),
    count: String(opts.count ?? 20),
  });
  if (opts.startTime) params.set("startTime", String(opts.startTime));

  const data = await riot.regional<unknown>(
    `/lol/match/v5/matches/by-puuid/${puuid}/ids?${params.toString()}`
  );
  return z.array(z.string()).parse(data);
}

const RuneSelectionSchema = z.object({
  perk: z.number(),
});

const RuneStyleSchema = z.object({
  style: z.number(),
  selections: z.array(RuneSelectionSchema),
});

const PerksSchema = z.object({
  styles: z.array(RuneStyleSchema),
});

const ParticipantSchema = z.object({
  puuid: z.string(),
  teamId: z.number(),
  championId: z.number(),
  championName: z.string(),
  win: z.boolean(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  totalMinionsKilled: z.number(),
  neutralMinionsKilled: z.number().optional(),
  visionScore: z.number().optional(),
  teamPosition: z.string().optional(),
  summoner1Id: z.number().optional(),
  summoner2Id: z.number().optional(),
  perks: PerksSchema.optional(),
  item0: z.number().optional(),
  item1: z.number().optional(),
  item2: z.number().optional(),
  item3: z.number().optional(),
  item4: z.number().optional(),
  item5: z.number().optional(),
  item6: z.number().optional(),
  challenges: z.object({ killParticipation: z.number().optional() }).optional(),
  // Campos usados solo por el scoreboard completo de la partida (los 10
  // jugadores) — se guardan en matches.raw y se leen bajo demanda, no en
  // el flujo normal de match_participants.
  riotIdGameName: z.string().optional(),
  riotIdTagline: z.string().optional(),
  goldEarned: z.number().optional(),
  totalDamageDealtToChampions: z.number().optional(),
  totalDamageTaken: z.number().optional(),
});

export const MatchSchema = z.object({
  metadata: z.object({ matchId: z.string() }),
  info: z.object({
    gameCreation: z.number(),
    gameDuration: z.number(),
    queueId: z.number(),
    gameVersion: z.string(),
    participants: z.array(ParticipantSchema),
  }),
});
export type RiotMatch = z.infer<typeof MatchSchema>;
export type RiotMatchParticipant = z.infer<typeof ParticipantSchema>;

export async function getMatchDetail(matchId: string): Promise<RiotMatch> {
  const data = await riot.regional<unknown>(`/lol/match/v5/matches/${matchId}`);
  return MatchSchema.parse(data);
}
