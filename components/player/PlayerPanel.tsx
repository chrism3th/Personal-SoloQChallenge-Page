"use client";

import { useEffect, useState } from "react";
import { PlayerHeader } from "./PlayerHeader";
import { ProfileStatStrip } from "./ProfileStatStrip";
import { MatchHistoryList } from "./MatchHistoryList";
import { MatchDetailModal } from "./MatchDetailModal";
import { LpHistoryChart } from "./LpHistoryChart";
import { RoleWinrateBars } from "./RoleWinrateBars";
import { TopChampionsGrid } from "./TopChampionsGrid";
import { ChampionStatsTable } from "./ChampionStatsTable";
import { cn } from "@/lib/utils/cn";
import type { PlayerPanelData } from "@/lib/ranking/panel";

type Tab = "resumen" | "historial";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "historial", label: "Historial" },
];

type PanelState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PlayerPanelData };

export function PlayerPanel({
  profileId,
  seasonId,
  mode = "standalone",
}: {
  profileId: string;
  seasonId: string | null;
  mode?: "inline" | "standalone";
}) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [state, setState] = useState<PanelState>({ status: "loading" });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
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
  }, [profileId, seasonId]);

  if (state.status === "loading") {
    return (
      <div className="panel p-6">
        <p className="font-body text-sm text-ink-muted">Cargando…</p>
      </div>
    );
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
        streak={data.streak}
        sparklineValues={data.sparklineValues}
        compact={mode === "inline"}
      />

      <ProfileStatStrip data={data} />

      <div className="flex gap-6 border-b border-obsidian-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "focus-ring -mb-px border-b-2 pb-2 font-mono text-xs uppercase tracking-widest transition-colors",
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <div className="flex flex-col gap-4">
          <LpHistoryChart data={data.chartData} />
          <div className="grid gap-4 lg:grid-cols-2">
            <TopChampionsGrid stats={data.championStats} />
            <RoleWinrateBars stats={data.roleStats} />
          </div>
          <ChampionStatsTable stats={data.championStats} />
        </div>
      )}

      {tab === "historial" && (
        <MatchHistoryList matches={data.matchHistory} onSelectMatch={setSelectedMatchId} />
      )}

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
