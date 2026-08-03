"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { RoleIcon } from "@/components/ladder/RoleIcon";
import { formatCompactNumber, formatGameDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { MatchScoreboard, ScoreboardParticipant } from "@/lib/ranking/scoreboard";

type ModalState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MatchScoreboard };

export function MatchDetailModal({
  matchId,
  highlightSlug,
  onClose,
}: {
  matchId: string;
  highlightSlug?: string | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<ModalState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/matches/${matchId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "No se pudo cargar el detalle de la partida.");
        }
        return res.json();
      })
      .then((data: MatchScoreboard) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-obsidian-950/80 p-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <Panel
        glowColor="var(--color-accent)"
        className="w-full max-w-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-body text-xs uppercase tracking-widest text-ink-muted">
            Detalle de la partida
            {state.status === "ready" && (
              <span className="ml-2 text-ink">{formatGameDuration(state.data.gameDuration)}</span>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full p-1.5 text-ink-muted hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {state.status === "loading" && (
          <p className="font-body text-sm text-ink-muted">Cargando…</p>
        )}

        {state.status === "error" && (
          <p className="font-body text-sm text-ink-muted">{state.message}</p>
        )}

        {state.status === "ready" && (
          <VersusTable data={state.data} highlightSlug={highlightSlug} onNavigate={onClose} />
        )}
      </Panel>
    </div>,
    document.body
  );
}

const GRID_COLS = "grid-cols-[1fr_2rem_1fr]";

function VersusTable({
  data,
  highlightSlug,
  onNavigate,
}: {
  data: MatchScoreboard;
  highlightSlug?: string | null;
  onNavigate: () => void;
}) {
  const [teamA, teamB] = data.teams;
  const rows = teamA.participants.map((p, i) => [p, teamB.participants[i]] as const);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className={cn("mb-3 grid items-center gap-2", GRID_COLS)}>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "font-display text-lg uppercase tracking-wide",
                teamA.win ? "text-win" : "text-loss"
              )}
            >
              {teamA.win ? "Victoria" : "Derrota"}
            </span>
            <span className="font-mono text-[11px] text-ink-muted">Blue Side</span>
          </div>
          <span className="text-center font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            vs
          </span>
          <div className="flex items-baseline justify-end gap-2">
            <span className="font-mono text-[11px] text-ink-muted">Red Side</span>
            <span
              className={cn(
                "font-display text-lg uppercase tracking-wide",
                teamB.win ? "text-win" : "text-loss"
              )}
            >
              {teamB.win ? "Victoria" : "Derrota"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {rows.map(([left, right], i) => (
            <div key={i} className={cn("grid items-center gap-2", GRID_COLS)}>
              <PlayerSide
                participant={left}
                highlighted={highlightSlug != null && left.profile?.slug === highlightSlug}
                onNavigate={onNavigate}
              />

              <div className="flex items-center justify-center text-ink-muted">
                <RoleIcon role={left.role ?? right?.role ?? null} showLabel={false} size={16} />
              </div>

              {right && (
                <PlayerSide
                  participant={right}
                  mirrored
                  highlighted={highlightSlug != null && right.profile?.slug === highlightSlug}
                  onNavigate={onNavigate}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerSide({
  participant: p,
  mirrored = false,
  highlighted,
  onNavigate,
}: {
  participant: ScoreboardParticipant;
  mirrored?: boolean;
  highlighted: boolean;
  onNavigate: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5",
        mirrored && "flex-row-reverse",
        highlighted ? "bg-accent/10 ring-1 ring-accent/40" : "hover:bg-obsidian-800/60"
      )}
    >
      <Image
        src={p.championIconUrl}
        alt=""
        width={32}
        height={32}
        unoptimized
        className="shrink-0 rounded-lg border border-obsidian-700"
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5",
          mirrored && "items-end text-right"
        )}
      >
        {p.profile ? (
          <Link
            href={`/jugador/${p.profile.slug}`}
            className="focus-ring truncate font-body text-sm font-semibold text-ink hover:text-accent"
            onClick={onNavigate}
          >
            {p.profile.displayName ?? p.riotName}
          </Link>
        ) : (
          <span className="truncate font-body text-sm text-ink-muted">{p.riotName}</span>
        )}
        <span className="font-mono text-[11px] text-ink-muted">
          {p.kills}/{p.deaths}/{p.assists}
          {p.goldEarned != null && <span className="ml-1.5">{formatCompactNumber(p.goldEarned)} oro</span>}
        </span>
      </div>

      <div className="flex shrink-0 gap-0.5">
        {p.itemIconUrls.map((src, i) =>
          src ? (
            <Image key={i} src={src} alt="" width={18} height={18} unoptimized className="rounded-sm" />
          ) : (
            <div key={i} className="h-[18px] w-[18px] rounded-sm bg-obsidian-800" />
          )
        )}
      </div>
    </div>
  );
}
