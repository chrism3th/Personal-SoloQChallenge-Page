import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLadder, getSeasonById } from "@/lib/ranking/season-scope";
import { LadderTable } from "@/components/ladder/LadderTable";
import { TierBadge } from "@/components/ladder/TierBadge";
import { formatDateRange } from "@/lib/utils/format";
import type { Database } from "@/lib/supabase/types";

type Season = Database["public"]["Tables"]["seasons"]["Row"];

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const supabase = await createClient();
  const season = await getSeasonById(supabase, seasonId);
  if (!season) notFound();

  if (season.is_closed) {
    const { data: results } = await supabase
      .from("season_results")
      .select("*")
      .eq("season_id", seasonId)
      .order("final_rank", { ascending: true });

    const profileIds = (results ?? []).map((r) => r.profile_id);
    const { data: profiles } =
      profileIds.length > 0
        ? await supabase.from("profiles").select("*").in("id", profileIds)
        : { data: [] };
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
        <SeasonHeader season={season} />
        <ol className="flex flex-col gap-2">
          {(results ?? []).map((result) => {
            const profile = profileById.get(result.profile_id);
            return (
              <li
                key={result.id}
                className="panel grid grid-cols-[3rem_1fr_auto] items-center gap-4 px-4 pr-10 py-3"
              >
                <span className="font-display text-3xl text-ink-muted">{result.final_rank}</span>
                {profile ? (
                  <Link
                    href={`/jugador/${profile.slug}`}
                    className="focus-ring truncate font-body text-lg font-semibold hover:text-accent"
                  >
                    {profile.display_name ?? profile.riot_game_name}
                  </Link>
                ) : (
                  <span className="font-body text-lg text-ink-muted">Jugador eliminado</span>
                )}
                <TierBadge
                  tier={result.tier}
                  division={result.division}
                  leaguePoints={result.league_points}
                />
              </li>
            );
          })}
          {(results ?? []).length === 0 && (
            <p className="font-body text-ink-muted">Esta temporada se cerró sin resultados.</p>
          )}
        </ol>
      </main>
    );
  }

  const entries = await getLadder(supabase, season);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-10">
      <SeasonHeader season={season} />
      <LadderTable entries={entries} seasonId={season.id} />
    </main>
  );
}

function SeasonHeader({ season }: { season: Season }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {formatDateRange(season.starts_at, season.ends_at)}
      </p>
      <h1 className="font-display text-5xl uppercase tracking-wide">{season.name}</h1>
    </div>
  );
}
