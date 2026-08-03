import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerPanel } from "@/components/player/PlayerPanel";
import { SeasonSelector } from "@/components/player/SeasonSelector";
import { getCurrentSeason, getSeasonById, listSeasons } from "@/lib/ranking/season-scope";

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
    .select("id, slug")
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      {seasons.length > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {season ? season.name : "Histórico"}
          </p>
          <SeasonSelector seasons={seasons} activeSeasonId={season?.id ?? null} />
        </div>
      )}
      <PlayerPanel
        key={`${profile.id}-${season?.id ?? "all"}`}
        profileId={profile.id}
        seasonId={season?.id ?? null}
        mode="standalone"
      />
    </main>
  );
}
