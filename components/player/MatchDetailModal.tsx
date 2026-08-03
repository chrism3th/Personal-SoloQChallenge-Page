"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { Coins, Eye, Swords, X } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { RoleIcon } from "@/components/ladder/RoleIcon";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";
import { formatCompactNumber, formatGameDuration, formatSigned } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { MatchScoreboard, ScoreboardParticipant } from "@/lib/ranking/scoreboard";

type ModalState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MatchScoreboard };

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const panelRef = useRef<HTMLDivElement>(null);

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

  /**
   * Trampa de foco. Sin esto el tabulador se escapaba del modal hacia la
   * página de atrás, que sigue montada: quien navega con teclado o lector de
   * pantalla quedaba recorriendo el ladder sin saber que el diálogo seguía
   * abierto.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Al abrir, el foco entra al diálogo; al cerrar, vuelve a donde estaba.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  // El scroll del fondo se congela mientras el diálogo está abierto.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <m.div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-obsidian-950/80 p-4 py-10 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.fast }}
      >
        <m.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
        >
          <Panel
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de la partida"
            tabIndex={-1}
            glowColor="var(--color-accent)"
            className="w-full p-6 outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="font-body text-xs uppercase tracking-widest text-ink-muted">
                Detalle de la partida
                {state.status === "ready" && (
                  <span className="ml-2 text-ink tabular">
                    {formatGameDuration(state.data.gameDuration)}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-full p-1.5 text-ink-muted transition-colors hover:text-ink"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {state.status === "loading" && (
              <div className="flex flex-col gap-2" role="status" aria-label="Cargando partida">
                <Skeleton className="h-6 w-48" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}

            {state.status === "error" && (
              <p className="font-body text-sm text-ink-muted">{state.message}</p>
            )}

            {state.status === "ready" && (
              <VersusTable data={state.data} highlightSlug={highlightSlug} onNavigate={onClose} />
            )}
          </Panel>
        </m.div>
      </m.div>
    </AnimatePresence>,
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
  const goldDiff = teamA.goldEarned - teamB.goldEarned;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className={cn("mb-2 grid items-center gap-2", GRID_COLS)}>
          <TeamHeader team={teamA} side="Blue Side" />
          <span className="text-center font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            vs
          </span>
          <TeamHeader team={teamB} side="Red Side" mirrored />
        </div>

        {/* Totales por equipo y diferencia de oro: los datos ya venían en el
            scoreboard (maxGoldEarned/maxDamageDealt existían solo para
            normalizar barras que nunca se habían construido). */}
        <div
          className={cn(
            "mb-4 grid items-center gap-2 rounded-card border border-obsidian-700 bg-obsidian-850/60 px-3 py-2",
            GRID_COLS
          )}
        >
          <TeamTotals team={teamA} />
          <span
            className={cn(
              "text-center font-mono text-[11px] font-semibold tabular",
              goldDiff === 0 ? "text-ink-muted" : goldDiff > 0 ? "text-win" : "text-loss"
            )}
            title="Diferencia de oro entre equipos"
          >
            {formatSigned(Math.round(goldDiff / 100) / 10, "k")}
          </span>
          <TeamTotals team={teamB} mirrored />
        </div>

        <div className="flex flex-col gap-1">
          {rows.map(([left, right], i) => (
            <div key={i} className={cn("grid items-center gap-2", GRID_COLS)}>
              <PlayerSide
                participant={left}
                scoreboard={data}
                highlighted={highlightSlug != null && left.profile?.slug === highlightSlug}
                onNavigate={onNavigate}
              />

              <div className="flex items-center justify-center text-ink-muted">
                <RoleIcon role={left.role ?? right?.role ?? null} showLabel={false} size={16} />
              </div>

              {right && (
                <PlayerSide
                  participant={right}
                  scoreboard={data}
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

function TeamHeader({
  team,
  side,
  mirrored = false,
}: {
  team: MatchScoreboard["teams"][number];
  side: string;
  mirrored?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline gap-2", mirrored && "justify-end")}>
      {mirrored && <span className="font-mono text-[11px] text-ink-muted">{side}</span>}
      <span
        className={cn(
          "font-display text-lg uppercase tracking-wide",
          team.win ? "text-win" : "text-loss"
        )}
      >
        {team.win ? "Victoria" : "Derrota"}
      </span>
      {!mirrored && <span className="font-mono text-[11px] text-ink-muted">{side}</span>}
    </div>
  );
}

function TeamTotals({
  team,
  mirrored = false,
}: {
  team: MatchScoreboard["teams"][number];
  mirrored?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-mono text-[11px] text-ink-muted tabular",
        mirrored && "justify-end"
      )}
    >
      <span className="flex items-center gap-1" title="Asesinatos del equipo">
        <Swords size={11} aria-hidden />
        {team.kills}
      </span>
      <span className="flex items-center gap-1" title="Oro del equipo">
        <Coins size={11} aria-hidden />
        {formatCompactNumber(team.goldEarned)}
      </span>
    </div>
  );
}

/** Barra fina normalizada contra el máximo de la partida. */
function MetricBar({
  value,
  max,
  color,
  label,
  mirrored,
}: {
  value: number | null;
  max: number;
  color: string;
  label: string;
  mirrored: boolean;
}) {
  if (value == null) return null;
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <span
      className={cn("flex h-1 w-full overflow-hidden rounded-full bg-obsidian-800", mirrored && "justify-end")}
      title={`${label}: ${value.toLocaleString("es-CL")}`}
    >
      <span className="h-full" style={{ width: `${percent}%`, background: color }} />
    </span>
  );
}

function PlayerSide({
  participant: p,
  scoreboard,
  mirrored = false,
  highlighted,
  onNavigate,
}: {
  participant: ScoreboardParticipant;
  scoreboard: MatchScoreboard;
  mirrored?: boolean;
  highlighted: boolean;
  onNavigate: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
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

      <div className={cn("flex min-w-0 flex-1 flex-col gap-1", mirrored && "items-end text-right")}>
        {p.profile ? (
          <Link
            href={`/jugador/${p.profile.slug}`}
            className="focus-ring truncate font-body text-sm font-semibold text-ink transition-colors hover:text-accent"
            onClick={onNavigate}
          >
            {p.profile.displayName ?? p.riotName}
          </Link>
        ) : (
          <span className="truncate font-body text-sm text-ink-muted">{p.riotName}</span>
        )}

        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-[11px] text-ink-muted tabular",
            mirrored && "flex-row-reverse"
          )}
        >
          <span className="text-ink">
            {p.kills}/{p.deaths}/{p.assists}
          </span>
          <span>{p.cs} CS</span>
          {p.visionScore != null && (
            <span className="flex items-center gap-0.5 text-cyan" title="Puntuación de visión">
              <Eye size={10} aria-hidden />
              {p.visionScore}
            </span>
          )}
        </span>

        {/* Daño y oro como barras comparables entre los 10 jugadores. */}
        <span className="flex w-full flex-col gap-0.5">
          <MetricBar
            value={p.damageDealt}
            max={scoreboard.maxDamageDealt}
            color="var(--color-loss)"
            label="Daño a campeones"
            mirrored={mirrored}
          />
          <MetricBar
            value={p.goldEarned}
            max={scoreboard.maxGoldEarned}
            color="var(--color-tier-gold)"
            label="Oro"
            mirrored={mirrored}
          />
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
