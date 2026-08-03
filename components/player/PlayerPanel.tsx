"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { PlayerHeader } from "./PlayerHeader";
import { ProfileStatStrip } from "./ProfileStatStrip";
import { MatchHistoryList } from "./MatchHistoryList";
import { MatchDetailModal } from "./MatchDetailModal";
import { LpHistoryChart } from "./LpHistoryChart";
import { RoleWinrateBars } from "./RoleWinrateBars";
import { TopChampionsGrid } from "./TopChampionsGrid";
import { ChampionStatsTable } from "./ChampionStatsTable";
import { Tabs } from "@/components/ui/Tabs";
import { PlayerPanelSkeleton } from "@/components/ui/Skeleton";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import type { PlayerPanelData } from "@/lib/ranking/panel";

type Tab = "resumen" | "historial";

type PanelState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PlayerPanelData };

export function PlayerPanel({
  profileId,
  seasonId,
  mode = "standalone",
  initialData,
}: {
  profileId: string;
  seasonId: string | null;
  mode?: "inline" | "standalone";
  /**
   * Datos ya resueltos en servidor. Cuando vienen, el panel se pinta completo
   * en el primer render y no dispara el fetch: así /jugador/[handle] tiene
   * contenido inicial real en vez de un esqueleto. La fila expandible del
   * ladder no los pasa (no sabe de antemano qué perfil se va a abrir) y sigue
   * cargando por fetch bajo demanda.
   */
  initialData?: PlayerPanelData;
}) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [state, setState] = useState<PanelState>(
    initialData ? { status: "ready", data: initialData } : { status: "loading" }
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const tabsId = useId();

  useEffect(() => {
    if (initialData) return;

    let cancelled = false;

    const qs = seasonId ? `?season=${seasonId}` : "";
    fetch(`/api/players/${profileId}/panel${qs}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "No se pudo cargar el panel del jugador.");
        }
        return res.json();
      })
      .then((data: PlayerPanelData) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [profileId, seasonId, initialData]);

  if (state.status === "loading") {
    return <PlayerPanelSkeleton compact={mode === "inline"} />;
  }

  if (state.status === "error") {
    return (
      <div className="panel p-6">
        <p className="font-body text-sm text-ink-muted">{state.message}</p>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className={cn("flex flex-col gap-4", mode === "standalone" && "gap-6")}>
      <PlayerHeader
        profile={data.profile}
        latestSnapshot={data.latestSnapshot}
        seasonRecord={data.seasonRecord}
        streak={data.streak}
        sparklineValues={data.sparklineValues}
        topChampionName={data.championStats[0]?.championName ?? null}
        compact={mode === "inline"}
      />

      <ProfileStatStrip data={data} />

      <Tabs
        tabs={[
          { id: "resumen" as Tab, label: "Resumen" },
          { id: "historial" as Tab, label: "Historial", count: data.matchHistory.length },
        ]}
        active={tab}
        onChange={setTab}
        layoutIdSuffix={tabsId}
      />

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
        >
          {tab === "resumen" ? (
            <div className="flex flex-col gap-4">
              <LpHistoryChart
                data={data.chartData}
                currentRank={
                  data.latestSnapshot
                    ? {
                        tier: data.latestSnapshot.tier,
                        division: data.latestSnapshot.division,
                        leaguePoints: data.latestSnapshot.leaguePoints,
                      }
                    : null
                }
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <TopChampionsGrid stats={data.championStats} />
                <RoleWinrateBars stats={data.roleStats} />
              </div>
              <ChampionStatsTable stats={data.championStats} />
            </div>
          ) : (
            <MatchHistoryList matches={data.matchHistory} onSelectMatch={setSelectedMatchId} />
          )}
        </m.div>
      </AnimatePresence>

      {selectedMatchId && (
        <MatchDetailModal
          key={selectedMatchId}
          matchId={selectedMatchId}
          highlightSlug={data.profile.slug}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}
