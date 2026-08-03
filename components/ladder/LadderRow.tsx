"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { WinrateBar } from "@/components/shared/WinrateBar";
import { TierBadge } from "./TierBadge";
import { LiveIndicator } from "./LiveIndicator";
import { RecentFormStrip } from "./RecentFormStrip";
import { RoleIcon } from "./RoleIcon";
import { TopChampionsPreview } from "./TopChampionsPreview";
import { PlayerPanel } from "@/components/player/PlayerPanel";
import type { LadderEntry } from "@/lib/ranking/season-scope";
import { tierGlowVar, winrate } from "@/lib/ranking/lp-math";
import { profileIconUrl } from "@/lib/riot/ddragon";
import { cn } from "@/lib/utils/cn";

export function LadderRow({
  entry,
  rank,
  version,
  seasonId,
}: {
  entry: LadderEntry;
  rank: number;
  version: string;
  seasonId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const { profile, snapshot, isLive, recentForm, topChampions, preferredRole, lastGameLpDelta } = entry;
  const wr = snapshot ? winrate(snapshot.wins, snapshot.losses) : 0;

  function toggle() {
    setExpanded((v) => !v);
  }

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
          glowColor={snapshot ? tierGlowVar(snapshot.tier) : undefined}
          className="ladder-row grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-2 px-4 py-3 transition-shadow sm:grid-cols-[3rem_1fr_6rem_9rem_9rem_auto] sm:gap-4 sm:px-5 lg:grid-cols-[3rem_minmax(12rem,1fr)_6rem_9rem_9rem_6.5rem_5rem_4.5rem_6rem_4rem]"
        >
          <span className="font-display text-2xl text-ink-muted sm:text-3xl">{rank}</span>

          <span className="flex min-w-0 items-center gap-2">
            {profile.profile_icon_id && (
              <Image
                src={profileIconUrl(version, profile.profile_icon_id)}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="shrink-0 rounded-lg border border-obsidian-700"
              />
            )}
            <span className="truncate font-body text-base font-semibold sm:text-lg">
              {profile.display_name ?? profile.riot_game_name}
              <span className="ml-1 hidden font-mono text-xs text-ink-muted sm:inline">
                #{profile.riot_tag_line}
              </span>
              {isLive && (
                <span
                  className="live-pulse ml-2 inline-block h-1.5 w-1.5 rounded-full bg-loss align-middle sm:hidden"
                  aria-hidden
                />
              )}
            </span>
          </span>

          <span className="hidden sm:block">
            <RoleIcon role={preferredRole} />
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

          <div className="hidden flex-col items-start gap-1 sm:flex">
            <span className="font-mono text-xs text-ink-muted">
              {snapshot ? `${snapshot.wins}V ${snapshot.losses}D · ${wr}% WR` : "—"}
            </span>
            {snapshot && <WinrateBar wins={snapshot.wins} losses={snapshot.losses} className="w-full" />}
          </div>

          <span className="hidden lg:block">
            <TopChampionsPreview champions={topChampions} version={version} />
          </span>

          <span className="hidden lg:block">
            <RecentFormStrip results={recentForm} />
          </span>

          <span className="hidden text-right font-mono text-xs font-semibold lg:block">
            {lastGameLpDelta != null ? (
              <span className={lastGameLpDelta >= 0 ? "text-win" : "text-loss"}>
                {lastGameLpDelta >= 0 ? "+" : ""}
                {lastGameLpDelta} LP
              </span>
            ) : (
              <span className="text-ink-muted">— LP</span>
            )}
          </span>

          <span className="hidden lg:block">{isLive && <LiveIndicator />}</span>

          <span className="flex shrink-0 items-center justify-end gap-2">
            <Link
              href={`/jugador/${profile.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="focus-ring rounded-full p-1.5 text-ink-muted hover:text-accent"
              aria-label="Abrir perfil completo"
            >
              <ExternalLink size={14} />
            </Link>
            <ChevronDown
              size={16}
              className={cn("text-ink-muted transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
          </span>
        </Panel>
      </div>

      {expanded && (
        <div className="mt-1 pl-2">
          <PlayerPanel
            key={`${profile.id}-${seasonId ?? "all"}`}
            profileId={profile.id}
            seasonId={seasonId}
            mode="inline"
          />
        </div>
      )}
    </li>
  );
}
