import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason, getSeasonById } from "@/lib/ranking/season-scope";
import { buildPlayerPanelData } from "@/lib/ranking/panel";

/**
 * Sirve la data del panel de jugador (header, gráfico de LP, historial,
 * stats por campeón/rol) consumida tanto por la fila expandible del ladder
 * como por /jugador/[handle]. No está detrás del middleware (que solo
 * protege rutas de página, no /api) — requiere su propio chequeo de sesión.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });

  const seasonId = request.nextUrl.searchParams.get("season");
  const season = seasonId
    ? await getSeasonById(supabase, seasonId)
    : await getCurrentSeason(supabase);

  const data = await buildPlayerPanelData(supabase, profile, season);
  return NextResponse.json(data);
}
