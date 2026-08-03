import Link from "next/link";
import { Panel } from "@/components/shared/Panel";
import { TierBadge } from "@/components/ladder/TierBadge";
import { WinLossBar } from "@/components/ui/Bar";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { tierGlowVar, winrate } from "@/lib/ranking/lp-math";
import type { FinalStanding } from "@/lib/ranking/hall-of-fame";
import { cn } from "@/lib/utils/cn";

const PLACE_COLORS = ["text-tier-challenger", "text-tier-silver", "text-tier-bronze"];

/**
 * Clasificación final de una temporada. Compartida por el detalle de temporada
 * cerrada y el salón de la fama.
 *
 * Muestra `wins`/`losses`, que `season_results` guardaba desde siempre y hasta
 * ahora ninguna vista leía.
 */
export function StandingsList({
  standings,
  limit,
}: {
  standings: FinalStanding[];
  limit?: number;
}) {
  if (standings.length === 0) {
    return (
      <Panel className="px-6 py-8 text-center">
        <p className="font-display text-lg uppercase tracking-wide text-ink">Sin clasificación</p>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Esta temporada se cerró sin resultados y tampoco hay registros de LP para reconstruirla.
        </p>
      </Panel>
    );
  }

  const visible = limit ? standings.slice(0, limit) : standings;

  return (
    <Stagger as="ol" className="flex flex-col gap-2">
      {visible.map((result) => {
        const games = result.wins + result.losses;
        return (
          <StaggerItem as="li" key={`${result.finalRank}-${result.profile?.id ?? "unknown"}`}>
            <Panel
              glowColor={tierGlowVar(result.tier)}
              className="tier-rail grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-3 pl-5 pr-4"
            >
              <span
                className={cn(
                  "font-display text-3xl tabular",
                  PLACE_COLORS[result.finalRank - 1] ?? "text-ink-muted"
                )}
              >
                {result.finalRank}
              </span>

              <div className="flex min-w-0 flex-col gap-1">
                {result.profile ? (
                  <Link
                    href={`/jugador/${result.profile.slug}`}
                    className="focus-ring w-fit truncate rounded-chip font-body text-lg font-semibold transition-colors hover:text-accent"
                  >
                    {result.profile.name}
                  </Link>
                ) : (
                  <span className="font-body text-lg text-ink-muted">Jugador eliminado</span>
                )}

                {games > 0 && (
                  <div className="flex max-w-[14rem] flex-col gap-1">
                    <span className="font-mono text-[11px] text-ink-muted tabular">
                      {result.wins}V {result.losses}D · {winrate(result.wins, result.losses)}% WR
                    </span>
                    <WinLossBar wins={result.wins} losses={result.losses} size="xs" />
                  </div>
                )}
              </div>

              <TierBadge
                tier={result.tier}
                division={result.division}
                leaguePoints={result.leaguePoints}
                size="sm"
              />
            </Panel>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
