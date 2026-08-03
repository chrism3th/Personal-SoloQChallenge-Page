import type { Metadata } from "next";
import Image from "next/image";
import { GitCompare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildComparison } from "@/lib/ranking/compare";
import { getCurrentSeason, getSeasonById, listSeasons } from "@/lib/ranking/season-scope";
import { ComparePicker } from "@/components/compare/ComparePicker";
import { CompareChart } from "@/components/compare/CompareChart";
import { SeasonSelector } from "@/components/player/SeasonSelector";
import { Container } from "@/components/layout/Container";
import { Panel } from "@/components/shared/Panel";
import { Stat } from "@/components/ui/Stat";
import { WinLossBar } from "@/components/ui/Bar";
import { Reveal } from "@/components/motion/Reveal";
import { winrate } from "@/lib/ranking/lp-math";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Comparar jugadores · SoloCumChallenge",
  description: "Compará rango, winrate, KDA y campeones en común entre jugadores del ladder.",
};

/** `?p=` puede venir una vez, varias, o ninguna. */
function readSelected(param: string | string[] | undefined): string[] {
  if (!param) return [];
  return Array.isArray(param) ? param : [param];
}

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string | string[]; season?: string }>;
}) {
  const { p, season: seasonIdParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: profiles }, currentSeason, seasons] = await Promise.all([
    supabase.from("profiles").select("id, slug, display_name, riot_game_name").eq("is_active", true),
    getCurrentSeason(supabase),
    listSeasons(supabase),
  ]);

  const season = seasonIdParam
    ? ((await getSeasonById(supabase, seasonIdParam)) ?? currentSeason)
    : currentSeason;

  const pickerProfiles = (profiles ?? []).map((profile) => ({
    id: profile.id,
    slug: profile.slug,
    name: profile.display_name ?? profile.riot_game_name,
  }));

  const selected = readSelected(p).filter((id) => pickerProfiles.some((prof) => prof.id === id));
  const comparison =
    selected.length >= 2 ? await buildComparison(supabase, selected, season) : null;

  return (
    <Container size="wide">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {season ? season.name : "Histórico"}
          </p>
          <h1 className="font-display text-5xl uppercase tracking-wide">Comparar</h1>
        </div>
        {seasons.length > 1 && (
          <SeasonSelector seasons={seasons} activeSeasonId={season?.id ?? null} />
        )}
      </div>

      {pickerProfiles.length < 2 ? (
        <EmptyState
          title="Hace falta más de un jugador"
          body="El comparador necesita al menos dos perfiles activos en el ladder. Por ahora hay uno solo: cuando se sume alguien más, esta pantalla cobra sentido."
        />
      ) : (
        <>
          <ComparePicker profiles={pickerProfiles} selected={selected} />

          {comparison ? (
            <div className="flex flex-col gap-6">
              <Reveal>
                <CompareChart
                  data={comparison.chartData}
                  players={comparison.players.map((player) => ({
                    slug: player.slug,
                    name: player.name,
                  }))}
                />
              </Reveal>

              <div
                className={cn(
                  "grid gap-4",
                  comparison.players.length > 2 ? "lg:grid-cols-3" : "lg:grid-cols-2"
                )}
              >
                {comparison.players.map((player) => {
                  const { seasonRecord, kdaAverage, streak } = player.data;
                  return (
                    <Panel key={player.profileId} className="flex flex-col gap-3 p-5">
                      <p className="font-display text-2xl uppercase tracking-wide">{player.name}</p>

                      <div className="grid grid-cols-2 gap-x-2 divide-x divide-obsidian-700">
                        <Stat
                          label="Récord"
                          compact
                          value={`${seasonRecord.wins}V ${seasonRecord.losses}D`}
                          detail={`${winrate(seasonRecord.wins, seasonRecord.losses)}% WR`}
                          className="px-0"
                        />
                        <Stat
                          label="KDA"
                          compact
                          value={kdaAverage ? kdaAverage.ratio.toFixed(2) : "—"}
                          detail={streak.result ? `${streak.count}${streak.result}` : undefined}
                        />
                      </div>

                      <WinLossBar wins={seasonRecord.wins} losses={seasonRecord.losses} size="sm" />
                    </Panel>
                  );
                })}
              </div>

              <SharedChampions comparison={comparison} />
            </div>
          ) : (
            <EmptyState
              title="Elegí dos jugadores"
              body="Seleccioná al menos dos perfiles de arriba para ver su progresión de LP en un mismo gráfico, su récord y los campeones que tienen en común."
            />
          )}
        </>
      )}
    </Container>
  );
}

function SharedChampions({
  comparison,
}: {
  comparison: NonNullable<Awaited<ReturnType<typeof buildComparison>>>;
}) {
  if (comparison.sharedChampions.length === 0) {
    return (
      <Panel className="px-6 py-8 text-center">
        <p className="font-display text-lg uppercase tracking-wide text-ink">
          Sin campeones en común
        </p>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Ninguno de los campeones jugados se repite entre los perfiles elegidos.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Campeones en común
      </p>
      <div className="flex flex-col gap-3">
        {comparison.sharedChampions.slice(0, 8).map((champion) => (
          <div key={champion.championName} className="flex flex-wrap items-center gap-3">
            <span className="flex w-40 shrink-0 items-center gap-2">
              <Image
                src={champion.championIconUrl}
                alt=""
                width={24}
                height={24}
                unoptimized
                className="rounded-md"
              />
              <span className="truncate font-body text-sm">{champion.championName}</span>
            </span>

            <div className="flex flex-1 flex-wrap gap-4">
              {champion.perPlayer.map((stat) => {
                const player = comparison.players.find((pl) => pl.slug === stat.slug);
                return (
                  <span
                    key={stat.slug}
                    className="font-mono text-[11px] text-ink-muted tabular"
                    title={player?.name}
                  >
                    {player?.name}:{" "}
                    <span className={stat.winrate >= 50 ? "text-win" : "text-loss"}>
                      {stat.winrate}%
                    </span>{" "}
                    ({stat.games}j)
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Panel className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <GitCompare size={28} className="text-ink-muted" aria-hidden />
      <p className="font-display text-xl uppercase tracking-wide text-ink">{title}</p>
      <p className="max-w-md font-body text-sm text-ink-muted">{body}</p>
    </Panel>
  );
}
