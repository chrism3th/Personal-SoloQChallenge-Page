import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PodiumHero } from "@/components/ladder/PodiumHero";
import { GroupSummaryPanel } from "@/components/ladder/GroupSummaryPanel";
import { LadderList } from "@/components/ladder/LadderList";
import { LadderTable } from "@/components/ladder/LadderTable";
import { PlayerHeader } from "@/components/player/PlayerHeader";
import { ProfileStatStrip } from "@/components/player/ProfileStatStrip";
import { LpHistoryChart } from "@/components/player/LpHistoryChart";
import { TopChampionsGrid } from "@/components/player/TopChampionsGrid";
import { RoleWinrateBars } from "@/components/player/RoleWinrateBars";
import { ChampionStatsTable } from "@/components/player/ChampionStatsTable";
import { StandingsList } from "@/components/seasons/StandingsList";
import { Container } from "@/components/layout/Container";
import { Panel } from "@/components/shared/Panel";
import {
  FIXTURE_GROUP_SUMMARY,
  FIXTURE_GROUP_SUMMARY_EMPTY,
  FIXTURE_VERSION,
  makeLadderEntries,
  makePanelData,
  makePodiumEntries,
  makeSingleLadderEntry,
  makeStandings,
} from "@/lib/dev/fixtures";

/**
 * Banco de pruebas visual, solo en desarrollo.
 *
 * Renderiza cada superficie contra fixtures en memoria, sin tocar la base ni
 * requerir sesión. Es la única forma de revisar el podio de tres, el ladder
 * poblado, la progresión de LP cruzando tiers o una temporada cerrada con
 * resultados: con los datos reales esas pantallas no se pueden ver.
 *
 * Incluye a propósito los estados vacíos reales (gráfico con un solo registro,
 * salón sin resultados, ladder de un jugador), porque son los que la gente se
 * encuentra hoy y los que más fácil se rompen sin que nadie lo note.
 */
export default function DevPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const panelData = makePanelData();
  const ladderEntries = makeLadderEntries();

  return (
    <Container size="wide" className="gap-12">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Solo desarrollo</p>
        <h1 className="font-display text-5xl uppercase tracking-wide">Banco de componentes</h1>
        <p className="mt-2 max-w-2xl font-body text-sm text-ink-muted">
          Datos falsos en memoria. Esta ruta no existe en producción y no lee ni escribe la base de
          datos.
        </p>
      </div>

      <Section title="Podio" note="Alturas escalonadas, splash del campeón principal y estado en vivo">
        <PodiumHero entries={makePodiumEntries()} />
      </Section>

      <Section title="Resumen del grupo">
        <GroupSummaryPanel summary={FIXTURE_GROUP_SUMMARY} version={FIXTURE_VERSION} />
      </Section>

      <Section
        title="Ladder poblado"
        note="9 filas: buscador, filtro por rol y orden por columna. En móvil refluye a tarjeta apilada"
      >
        <LadderList
          entries={ladderEntries}
          version={FIXTURE_VERSION}
          seasonId={null}
          liveByProfileId={{
            "fixture-0": { championName: "Ahri", championIconUrl: null },
            "fixture-3": { championName: "Thresh", championIconUrl: null },
          }}
        />
      </Section>

      <Section title="Cabecera de jugador">
        <PlayerHeader
          profile={panelData.profile}
          latestSnapshot={panelData.latestSnapshot}
          seasonRecord={panelData.seasonRecord}
          streak={panelData.streak}
          sparklineValues={panelData.sparklineValues}
          topChampionName={panelData.championStats[0]?.championName}
        />
      </Section>

      <Section title="Franja de estadísticas">
        <ProfileStatStrip data={panelData} />
      </Section>

      <Section
        title="Progresión de rango"
        note="30 registros cruzando de Platinum a Diamond, con bandas de tier reales"
      >
        <LpHistoryChart data={panelData.chartData} />
      </Section>

      <Section title="Pool de campeones y roles">
        <div className="grid gap-4 lg:grid-cols-2">
          <TopChampionsGrid stats={panelData.championStats} />
          <RoleWinrateBars stats={panelData.roleStats} />
        </div>
      </Section>

      <Section title="Tabla de campeones" note="Ordenable por columna, con CS y KP">
        <ChampionStatsTable stats={panelData.championStats} />
      </Section>

      <Section title="Temporada cerrada" note="Clasificación final con récord V/D">
        <StandingsList standings={makeStandings()} />
      </Section>

      {/* ----------------------------------------------------------------
          Estados vacíos: el estado real de la base hoy.
      ---------------------------------------------------------------- */}
      <div className="border-t border-obsidian-700 pt-8">
        <h2 className="font-display text-3xl uppercase tracking-wide">Estados vacíos</h2>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Lo que se ve con los datos que hay hoy en la base: un jugador, un registro de LP, sin
          temporadas cerradas.
        </p>
      </div>

      <Section title="Gráfico con un solo registro">
        <LpHistoryChart
          data={panelData.chartData.slice(0, 1)}
          currentRank={{ tier: "PLATINUM", division: "IV", leaguePoints: 40 }}
        />
      </Section>

      <Section title="Ladder de un solo jugador">
        {/* Vía LadderTable para ejercitar también la envoltura de servidor. */}
        <LadderTable entries={makeSingleLadderEntry()} seasonId={null} />
      </Section>

      <Section title="Resumen del grupo degradado" note="Un jugador, sin rachas ni movimiento">
        <GroupSummaryPanel summary={FIXTURE_GROUP_SUMMARY_EMPTY} version={FIXTURE_VERSION} />
      </Section>

      <Section title="Ladder vacío">
        <LadderTable entries={[]} seasonId={null} />
      </Section>

      <Section title="Podio vacío">
        <PodiumHero entries={[]} />
      </Section>

      <Section title="Clasificación vacía" note="Temporada cerrada sin resultados ni snapshots">
        <StandingsList standings={[]} />
      </Section>

      <Section title="Sin campeones ni partidas">
        <div className="grid gap-4 lg:grid-cols-2">
          <TopChampionsGrid stats={[]} />
          <RoleWinrateBars stats={[]} />
        </div>
      </Section>
    </Container>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-2xl uppercase tracking-wide text-ink">{title}</h2>
        {note && <p className="font-mono text-[11px] text-ink-muted">{note}</p>}
      </div>
      <Panel className="bg-obsidian-950/40 p-4">{children}</Panel>
    </section>
  );
}
