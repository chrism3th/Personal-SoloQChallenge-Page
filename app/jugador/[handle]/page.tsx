import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerPanel } from "@/components/player/PlayerPanel";
import { SeasonSelector } from "@/components/player/SeasonSelector";
import { Container } from "@/components/layout/Container";
import { buildPlayerPanelData } from "@/lib/ranking/panel";
import { formatTierDivision, winrate } from "@/lib/ranking/lp-math";
import { getCurrentSeason, getSeasonById, listSeasons } from "@/lib/ranking/season-scope";

/**
 * Metadatos reales por jugador. La página no tenía ninguno: al compartir un
 * perfil salía el título genérico del sitio, porque todo el contenido llegaba
 * por fetch del cliente y en servidor no había nada que describir.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, riot_game_name, riot_tag_line")
    .eq("slug", handle)
    .maybeSingle();

  if (!profile) return { title: "Jugador no encontrado · SoloCumChallenge" };

  const name = profile.display_name ?? profile.riot_game_name;
  return {
    title: `${name} · SoloCumChallenge`,
    description: `Rango, racha e historial de partidas de ${profile.riot_game_name}#${profile.riot_tag_line} en el ladder interno.`,
  };
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { handle } = await params;
  const { season: seasonIdParam } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", handle)
    .maybeSingle();

  if (!profile) notFound();

  const [currentSeason, seasons] = await Promise.all([
    getCurrentSeason(supabase),
    listSeasons(supabase),
  ]);
  const season = seasonIdParam
    ? ((await getSeasonById(supabase, seasonIdParam)) ?? currentSeason)
    : currentSeason;

  // Se resuelve en servidor y se pasa como initialData: el panel se pinta
  // completo en el primer render en vez de mostrar un esqueleto y disparar un
  // fetch al mismo endpoint desde el cliente.
  const panelData = await buildPlayerPanelData(supabase, profile, season);
  const snapshot = panelData.latestSnapshot;

  return (
    <Container>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {season ? season.name : "Histórico"}
          </p>
          {snapshot && (
            <p className="font-mono text-xs text-ink-muted tabular">
              {formatTierDivision(snapshot.tier, snapshot.division)} · {snapshot.leaguePoints} LP ·{" "}
              {winrate(panelData.seasonRecord.wins, panelData.seasonRecord.losses)}% WR
            </p>
          )}
        </div>
        {seasons.length > 1 && (
          <SeasonSelector seasons={seasons} activeSeasonId={season?.id ?? null} />
        )}
      </div>

      <PlayerPanel
        key={`${profile.id}-${season?.id ?? "all"}`}
        profileId={profile.id}
        seasonId={season?.id ?? null}
        mode="standalone"
        initialData={panelData}
      />
    </Container>
  );
}
