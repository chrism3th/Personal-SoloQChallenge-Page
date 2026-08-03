"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { WinLossBar } from "@/components/ui/Bar";
import { Expand } from "@/components/motion/Expand";
import { TierBadge } from "./TierBadge";
import { LiveIndicator } from "./LiveIndicator";
import { RecentFormStrip } from "./RecentFormStrip";
import { RoleIcon } from "./RoleIcon";
import { StreakBadge } from "./StreakBadge";
import { TopChampionsPreview } from "./TopChampionsPreview";
import { LADDER_GRID } from "./grid";
import { PlayerPanel } from "@/components/player/PlayerPanel";
import type { LadderEntry } from "@/lib/ranking/season-scope";
import { tierGlowVar, winrate } from "@/lib/ranking/lp-math";
import { profileIconUrl } from "@/lib/riot/ddragon";
import { formatRelativeTime, formatSigned } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type LadderRowLive = {
  championName: string | null;
  championIconUrl: string | null;
};

export function LadderRow({
  entry,
  rank,
  version,
  seasonId,
  live,
}: {
  entry: LadderEntry;
  rank: number;
  version: string;
  seasonId: string | null;
  /** Campeón en vivo ya resuelto en servidor (el mapeo id -> nombre es async). */
  live?: LadderRowLive;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    profile,
    snapshot,
    isLive,
    recentForm,
    topChampions,
    preferredRole,
    lastGameLpDelta,
    streak,
    games,
    lastGameAt,
  } = entry;
  const wr = snapshot ? winrate(snapshot.wins, snapshot.losses) : 0;
  const glow = snapshot ? tierGlowVar(snapshot.tier) : undefined;

  function toggle() {
    setExpanded((v) => !v);
  }

  const lpDelta =
    lastGameLpDelta != null ? (
      <span className={lastGameLpDelta >= 0 ? "text-win" : "text-loss"}>
        {formatSigned(lastGameLpDelta, " LP")}
      </span>
    ) : (
      <span className="text-ink-muted">— LP</span>
    );

  return (
    <li>
      {/* Nota: role="button" en un div (no un <button> nativo) a propósito —
          la fila necesita contener un <Link> real como acción secundaria
          ("abrir perfil"), y un <a> anidado dentro de un <button> nativo es
          contenido inválido en HTML. */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        aria-expanded={expanded}
        className="focus-ring block w-full cursor-pointer text-left"
      >
        <Panel
          glowColor={glow}
          className={cn(
            // Móvil y tablet: tarjeta apilada. Antes esta fila escondía 6 de
            // sus 10 columnas por debajo de `lg`, así que en el teléfono no se
            // veían ni campeones, ni forma, ni racha, ni LP.
            "ladder-row flex flex-col gap-3 py-3 pl-5 pr-4",
            "lg:grid lg:items-center lg:gap-3 lg:py-3",
            LADDER_GRID
          )}
        >
          {/* --- Cabecera: puesto, jugador, acciones --- */}
          <span className="hidden font-display text-3xl text-ink-muted tabular lg:block">
            {rank}
          </span>

          <div className="flex min-w-0 items-center gap-3">
            <span className="font-display text-2xl text-ink-muted tabular lg:hidden">{rank}</span>

            {profile.profile_icon_id && (
              <Image
                src={profileIconUrl(version, profile.profile_icon_id)}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="shrink-0 rounded-lg border border-obsidian-700"
              />
            )}

            <span className="flex min-w-0 flex-col">
              <span className="truncate font-body text-base font-semibold lg:text-lg">
                {profile.display_name ?? profile.riot_game_name}
              </span>
              <span className="truncate font-mono text-[11px] text-ink-muted">
                #{profile.riot_tag_line}
                {lastGameAt && (
                  <span className="ml-1.5">· {formatRelativeTime(lastGameAt)}</span>
                )}
              </span>
            </span>

            {/* Acciones: en la tarjeta apilada van pegadas al nombre; en la
                grilla viven en su propia columna al final. */}
            <span className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
              <ProfileLink slug={profile.slug} />
              <Chevron expanded={expanded} />
            </span>
          </div>

          <span className="hidden lg:block">
            <RoleIcon role={preferredRole} showLabel={false} />
          </span>

          {/* --- Elo --- */}
          <div className="flex items-center justify-between gap-3 lg:block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted lg:hidden">
              Elo
            </span>
            {snapshot ? (
              <TierBadge
                tier={snapshot.tier}
                division={snapshot.division}
                leaguePoints={snapshot.league_points}
                size="sm"
              />
            ) : (
              <span className="font-mono text-xs text-ink-muted">Sin datos</span>
            )}
          </div>

          {/* --- Récord --- */}
          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start lg:gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted lg:hidden">
              V/D
            </span>
            <div className="flex w-full max-w-[9rem] flex-col items-end gap-1 lg:max-w-none lg:items-start">
              <span className="font-mono text-xs text-ink-muted tabular">
                {snapshot ? `${snapshot.wins}V ${snapshot.losses}D · ${wr}%` : "—"}
              </span>
              {snapshot && <WinLossBar wins={snapshot.wins} losses={snapshot.losses} size="sm" />}
            </div>
          </div>

          {/* --- Campeones --- */}
          <div className="flex items-center justify-between gap-3 lg:block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted lg:hidden">
              Campeones
            </span>
            <TopChampionsPreview champions={topChampions} version={version} />
          </div>

          {/* --- Forma / racha / LP: en móvil comparten una sola línea --- */}
          <div className="flex items-center justify-between gap-3 lg:block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted lg:hidden">
              Forma
            </span>
            <span className="flex items-center gap-2">
              <RecentFormStrip results={recentForm} />
              <span className="lg:hidden">
                <StreakBadge streak={streak} />
              </span>
            </span>
          </div>

          <span className="hidden lg:block">
            <StreakBadge streak={streak} />
          </span>

          <div className="flex items-center justify-between gap-3 lg:block lg:text-right">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted lg:hidden">
              Última partida
            </span>
            <span className="font-mono text-xs font-semibold tabular">{lpDelta}</span>
          </div>

          {/* --- Estado: partidas jugadas y, si corresponde, en vivo.
                 En la grilla se apilan: el indicador en vivo ("Ahri · 14 min")
                 no entra al lado del contador sin invadir las acciones. --- */}
          <div className="flex min-w-0 items-center justify-between gap-3 lg:flex-col lg:items-start lg:justify-center lg:gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted lg:hidden">
              Partidas
            </span>
            <span className="flex min-w-0 items-center gap-2 lg:contents">
              <span className="font-mono text-xs text-ink-muted tabular">{games}j</span>
              {isLive && (
                <LiveIndicator
                  compact
                  championName={live?.championName}
                  championIconUrl={live?.championIconUrl}
                  gameStartTime={entry.liveGameStartTime}
                />
              )}
            </span>
          </div>

          <span className="hidden shrink-0 items-center justify-end gap-2 lg:flex">
            <ProfileLink slug={profile.slug} />
            <Chevron expanded={expanded} />
          </span>
        </Panel>
      </div>

      <Expand open={expanded}>
        <div className="mt-1 pl-2">
          <PlayerPanel
            key={`${profile.id}-${seasonId ?? "all"}`}
            profileId={profile.id}
            seasonId={seasonId}
            mode="inline"
          />
        </div>
      </Expand>
    </li>
  );
}

function ProfileLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/jugador/${slug}`}
      onClick={(e) => e.stopPropagation()}
      className="focus-ring rounded-full p-1.5 text-ink-muted transition-colors hover:text-accent"
      aria-label="Abrir perfil completo"
    >
      <ExternalLink size={14} />
    </Link>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      size={16}
      className={cn(
        "text-ink-muted transition-transform duration-[--dur-base]",
        expanded && "rotate-180"
      )}
      aria-hidden
    />
  );
}
