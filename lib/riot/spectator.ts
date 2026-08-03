import "server-only";
import { z } from "zod";
import { RiotApiError, riot } from "./client";

const ActiveGameSchema = z.object({
  gameId: z.number(),
  gameMode: z.string(),
  gameStartTime: z.number(),
  participants: z.array(z.object({ puuid: z.string(), championId: z.number() })),
});
export type RiotActiveGame = z.infer<typeof ActiveGameSchema>;

/** null si el jugador no está en partida ahora mismo (404 de Riot). */
export async function getActiveGameByPuuid(puuid: string): Promise<RiotActiveGame | null> {
  try {
    const data = await riot.platform<unknown>(`/lol/spectator/v5/active-games/by-puuid/${puuid}`);
    return ActiveGameSchema.parse(data);
  } catch (err) {
    if (err instanceof RiotApiError && err.status === 404) return null;
    throw err;
  }
}
