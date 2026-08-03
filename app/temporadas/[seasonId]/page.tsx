import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLadder, getSeasonById } from "@/lib/ranking/season-scope";
import { getSeasonStandings } from "@/lib/ranking/hall-of-fame";
import { LadderTable } from "@/components/ladder/LadderTable";
import { StandingsList } from "@/components/seasons/StandingsList";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
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
    const { standings, source } = await getSeasonStandings(supabase, season);

    return (
      <Container>
        <SeasonHeader season={season} />
        {source === "derived" && standings.length > 0 && (
          <p className="font-body text-xs text-ink-muted">
            Esta temporada se cerró sin guardar resultados, así que la clasificación se reconstruyó
            a partir del último registro de LP de cada jugador dentro del periodo.
          </p>
        )}
        {/* La lista es un <ol>; el mensaje de vacío vive dentro de
            StandingsList y no como hermano suelto — antes había un <p> como
            hijo directo del <ol>, que es HTML inválido. */}
        <StandingsList standings={standings} />
      </Container>
    );
  }

  const entries = await getLadder(supabase, season);

  return (
    <Container size="wide">
      <SeasonHeader season={season} />
      <LadderTable entries={entries} seasonId={season.id} />
    </Container>
  );
}

function SeasonHeader({ season }: { season: Season }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {formatDateRange(season.starts_at, season.ends_at)}
        </p>
        <h1 className="font-display text-5xl uppercase tracking-wide">{season.name}</h1>
      </div>
      {season.is_current && <Badge tone="win">En curso</Badge>}
      {season.is_closed && <Badge tone="neutral">Cerrada</Badge>}
    </div>
  );
}
