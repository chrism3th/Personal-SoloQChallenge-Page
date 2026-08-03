import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildMatchScoreboard } from "@/lib/ranking/scoreboard";

/**
 * Sirve el scoreboard completo (10 jugadores) de una partida, leyendo
 * matches.raw. No está detrás del middleware (que solo protege rutas de
 * página, no /api) — requiere su propio chequeo de sesión.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: match } = await supabase
    .from("matches")
    .select("id, game_creation, game_duration, raw")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return NextResponse.json({ error: "Partida no encontrada" }, { status: 404 });

  const scoreboard = await buildMatchScoreboard(supabase, match);
  if (!scoreboard) {
    return NextResponse.json(
      { error: "Detalle no disponible para esta partida antigua." },
      { status: 404 }
    );
  }

  return NextResponse.json(scoreboard);
}
