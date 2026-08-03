import "server-only";
import { z } from "zod";
import { riot } from "./client";

const AccountSchema = z.object({
  puuid: z.string(),
  gameName: z.string().optional(),
  tagLine: z.string().optional(),
});
export type RiotAccount = z.infer<typeof AccountSchema>;

/** Riot ID (gameName#tagLine) -> PUUID. Usado en el registro para vincular la cuenta. */
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<RiotAccount> {
  const data = await riot.regional<unknown>(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
  return AccountSchema.parse(data);
}

export async function getAccountByPuuid(puuid: string): Promise<RiotAccount> {
  const data = await riot.regional<unknown>(`/riot/account/v1/accounts/by-puuid/${puuid}`);
  return AccountSchema.parse(data);
}
