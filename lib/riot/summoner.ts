import "server-only";
import { z } from "zod";
import { riot } from "./client";

const SummonerSchema = z.object({
  // Riot dejó de garantizar este campo (summonerId cifrado) en la
  // respuesta como parte de su migración a PUUID — puede venir undefined.
  // Nunca depender de él: League-v4 usa by-puuid, no by-summoner.
  id: z.string().optional(),
  puuid: z.string(),
  profileIconId: z.number(),
  summonerLevel: z.number(),
});
export type RiotSummoner = z.infer<typeof SummonerSchema>;

/** Solo se usa hoy para el ícono/nivel de invocador — nunca para obtener el rango. */
export async function getSummonerByPuuid(puuid: string): Promise<RiotSummoner> {
  const data = await riot.platform<unknown>(`/lol/summoner/v4/summoners/by-puuid/${puuid}`);
  return SummonerSchema.parse(data);
}
