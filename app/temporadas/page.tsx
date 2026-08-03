import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSeasonParticipantIds, listSeasons } from "@/lib/ranking/season-scope";
import { formatDateRange } from "@/lib/utils/format";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/layout/Container";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { LinkButton } from "@/components/ui/Button";

export default async function TemporadasPage() {
  const supabase = await createClient();
  const seasons = await listSeasons(supabase);

  // Conteo de participantes por temporada: el lado derecho de cada tarjeta
  // estaba vacío (el `justify-between` no tenía segundo hijo).
  const participantCounts = await Promise.all(
    seasons.map(async (season) => [
      season.id,
      (await getSeasonParticipantIds(supabase, season.id)).length,
    ] as const)
  );
  const countBySeason = new Map(participantCounts);

  const closedCount = seasons.filter((season) => season.is_closed).length;

  return (
    <Container>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-5xl uppercase tracking-wide">Temporadas</h1>
        {closedCount > 0 && (
          <LinkButton href="/temporadas/salon" variant="secondary">
            <Trophy size={14} aria-hidden />
            Salón de la fama
          </LinkButton>
        )}
      </div>

      {seasons.length === 0 ? (
        <Panel className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <p className="font-display text-xl uppercase tracking-wide text-ink">Sin temporadas</p>
          <p className="max-w-sm font-body text-sm text-ink-muted">
            Todavía no se creó ninguna temporada. Un admin puede abrir la primera desde el panel de
            administración.
          </p>
        </Panel>
      ) : (
        <Stagger className="flex flex-col gap-3">
          {seasons.map((season) => (
            <StaggerItem key={season.id}>
              <Link href={`/temporadas/${season.id}`} className="focus-ring block rounded-panel">
                <Panel className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:border-accent">
                  <div>
                    <p className="flex flex-wrap items-center gap-3 font-display text-2xl uppercase tracking-wide">
                      {season.name}
                      {season.is_current && (
                        <Badge tone="win" size="sm">
                          En curso
                        </Badge>
                      )}
                      {season.is_closed && (
                        <Badge tone="neutral" size="sm">
                          Cerrada
                        </Badge>
                      )}
                    </p>
                    <p className="font-mono text-xs text-ink-muted">
                      {formatDateRange(season.starts_at, season.ends_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-2xl text-ink tabular">
                      {countBySeason.get(season.id) ?? 0}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                      participantes
                    </p>
                  </div>
                </Panel>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </Container>
  );
}
