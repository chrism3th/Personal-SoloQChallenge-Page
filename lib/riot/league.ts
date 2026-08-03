import "server-only";
import { z } from "zod";
import { riot } from "./client";

const TierSchema = z.enum([
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
]);

const LeagueEntrySchema = z.object({
  queueType: z.string(),
  tier: TierSchema,
  rank: z.enum(["I", "II", "III", "IV"]).optional(),
  leaguePoints: z.number(),
  wins: z.number(),
  losses: z.number(),
});
export type RiotLeagueEntry = z.infer<typeof LeagueEntrySchema>;

/**
 * Riot dejó de garantizar el `id` (summonerId cifrado) en las respuestas
 * de Summoner-v4 como parte de su migración a PUUID — by-puuid es hoy la
 * forma correcta y recomendada de pedir el rango, sin depender de ese
 * campo en absoluto.
 */
export async function getLeagueEntriesByPuuid(puuid: string): Promise<RiotLeagueEntry[]> {
  const data = await riot.platform<unknown[]>(`/lol/league/v4/entries/by-puuid/${puuid}`);
  return z.array(LeagueEntrySchema).parse(data);
}

/** Master/Grandmaster/Challenger no tienen división real — el campo `rank` de Riot se ignora para esos tiers. */
export function getSoloQueueEntry(entries: RiotLeagueEntry[]): RiotLeagueEntry | null {
  return entries.find((entry) => entry.queueType === "RANKED_SOLO_5x5") ?? null;
}
