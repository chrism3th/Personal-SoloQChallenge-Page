import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listHallOfFame } from "@/lib/ranking/hall-of-fame";
import { StandingsList } from "@/components/seasons/StandingsList";
import { Container } from "@/components/layout/Container";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { formatDateRange } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Salón de la fama · SoloCumChallenge",
  description: "Los podios de todas las temporadas cerradas del ladder interno.",
};

/**
 * Salón de la fama: el podio de cada temporada cerrada.
 *
 * Vive bajo /temporadas a propósito — el segmento estático gana al dinámico
 * `[seasonId]`, y el prefijo ya está protegido por proxy.ts, así que no hace
 * falta tocar la lista de rutas protegidas.
 */
export default async function SalonDeLaFamaPage() {
  const supabase = await createClient();
  const seasons = await listHallOfFame(supabase);

  return (
    <Container>
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Histórico</p>
        <h1 className="font-display text-5xl uppercase tracking-wide">Salón de la fama</h1>
      </div>

      {seasons.length === 0 ? (
        <Panel className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Trophy size={28} className="text-ink-muted" aria-hidden />
          <p className="font-display text-xl uppercase tracking-wide text-ink">
            Todavía sin temporadas cerradas
          </p>
          <p className="max-w-sm font-body text-sm text-ink-muted">
            Cuando una temporada se cierre, su podio queda acá para siempre. Mientras tanto, la
            acción está en el ladder.
          </p>
          <Link
            href="/ladder"
            className="focus-ring mt-2 rounded-chip font-body text-sm text-accent transition-colors hover:text-accent-bright"
          >
            Ir al ladder →
          </Link>
        </Panel>
      ) : (
        <div className="flex flex-col gap-8">
          {seasons.map(({ season, standings, source }) => (
            <Reveal key={season.id}>
              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/temporadas/${season.id}`}
                      className="focus-ring rounded-chip font-display text-2xl uppercase tracking-wide transition-colors hover:text-accent"
                    >
                      {season.name}
                    </Link>
                    {source === "derived" && (
                      <Badge tone="neutral" size="sm" title="Reconstruida desde los registros de LP">
                        Reconstruida
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-ink-muted">
                    {formatDateRange(season.starts_at, season.ends_at)}
                  </p>
                </div>

                {/* Solo el podio: el detalle completo vive en la página de la temporada. */}
                <StandingsList standings={standings} limit={3} />
              </section>
            </Reveal>
          ))}
        </div>
      )}
    </Container>
  );
}
