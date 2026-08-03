import { createClient } from "@/lib/supabase/server";
import {
  getCurrentSeason,
  getLadder,
  getSeasonById,
  listSeasons,
} from "@/lib/ranking/season-scope";
import { buildGroupSummary } from "@/lib/ranking/group-summary";
import { getLatestDdragonVersion } from "@/lib/riot/ddragon";
import { LadderTable } from "@/components/ladder/LadderTable";
import { GroupSummaryPanel } from "@/components/ladder/GroupSummaryPanel";
import { SeasonSelector } from "@/components/player/SeasonSelector";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";

export default async function LadderPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonIdParam } = await searchParams;
  const supabase = await createClient();

  const [currentSeason, seasons, version] = await Promise.all([
    getCurrentSeason(supabase),
    listSeasons(supabase),
    getLatestDdragonVersion(),
  ]);

  // El selector de temporada solo existía en el perfil; el ladder estaba
  // clavado a la temporada en curso y no había forma de mirar una anterior.
  const season = seasonIdParam
    ? ((await getSeasonById(supabase, seasonIdParam)) ?? currentSeason)
    : currentSeason;

  const entries = await getLadder(supabase, season);
  const summary = await buildGroupSummary(supabase, entries, season);

  return (
    <Container size="wide">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {season ? season.name : "Ladder histórico"}
          </p>
          <h1 className="font-display text-5xl uppercase tracking-wide">Ladder</h1>
        </div>
        {seasons.length > 1 && (
          <SeasonSelector seasons={seasons} activeSeasonId={season?.id ?? null} />
        )}
      </div>

      {entries.length > 0 && (
        <Reveal>
          <GroupSummaryPanel summary={summary} version={version} />
        </Reveal>
      )}

      <LadderTable entries={entries} seasonId={season?.id ?? null} />
    </Container>
  );
}
