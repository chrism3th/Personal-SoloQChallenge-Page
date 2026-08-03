import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccountByRiotId } from "@/lib/riot/account";
import { RiotApiError } from "@/lib/riot/client";
import { createAdminClient } from "@/lib/supabase/admin";

const BodySchema = z.object({
  gameName: z.string().trim().min(1).max(32),
  tagLine: z.string().trim().min(1).max(10),
});

/** Validación en vivo (debounced) del Riot ID durante el registro. */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Riot ID inválido." }, { status: 400 });
  }
  const { gameName, tagLine } = parsed.data;

  try {
    const account = await getAccountByRiotId(gameName, tagLine);

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("riot_puuid", account.puuid)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Esta cuenta de Riot ya está vinculada a otro usuario." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      puuid: account.puuid,
      gameName: account.gameName ?? gameName,
      tagLine: account.tagLine ?? tagLine,
    });
  } catch (err) {
    if (err instanceof RiotApiError && err.status === 404) {
      return NextResponse.json(
        { error: "No encontramos ese Riot ID en LAS. Verifica el nombre y el tag." },
        { status: 404 }
      );
    }
    console.error("resolve-riot-id error", err);
    return NextResponse.json(
      { error: "No se pudo verificar el Riot ID. Intenta de nuevo en unos segundos." },
      { status: 502 }
    );
  }
}
