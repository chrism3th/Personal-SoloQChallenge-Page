"use client";

import Image from "next/image";
import type { PanelMatchRow } from "@/lib/ranking/panel";
import { formatGameDuration, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function MatchHistoryList({
  matches,
  onSelectMatch,
}: {
  matches: PanelMatchRow[];
  onSelectMatch: (matchId: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="panel p-6">
        <p className="font-body text-sm text-ink-muted">Todavía no hay partidas registradas.</p>
      </div>
    );
  }

  return (
    <div className="panel p-6">
      <p className="mb-4 font-body text-xs uppercase tracking-widest text-ink-muted">
        Historial de partidas
      </p>
      <ol className="flex flex-col gap-2">
        {matches.map((match, index) => {
          const kda =
            match.deaths === 0
              ? match.kills + match.assists
              : (match.kills + match.assists) / match.deaths;

          return (
            <li key={match.matchId || index}>
              <button
                type="button"
                onClick={() => match.matchId && onSelectMatch(match.matchId)}
                disabled={!match.matchId}
                className={cn(
                  "focus-ring flex w-full flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors sm:flex-nowrap",
                  match.win
                    ? "border-win/25 bg-win/5 hover:bg-win/10"
                    : "border-loss/25 bg-loss/5 hover:bg-loss/10",
                  !match.matchId && "cursor-default hover:bg-transparent"
                )}
              >
                {/* resultado + tiempo */}
                <div className="w-20 shrink-0">
                  <p
                    className={cn(
                      "font-body text-sm font-bold",
                      match.win ? "text-win" : "text-loss"
                    )}
                  >
                    {match.win ? "Victoria" : "Derrota"}
                  </p>
                  {match.gameCreation && (
                    <p className="font-mono text-[11px] text-ink-muted">
                      {formatRelativeTime(match.gameCreation)} ·{" "}
                      {formatGameDuration(match.gameDuration)}
                    </p>
                  )}
                </div>

                {/* campeón + hechizos + runas */}
                <div className="flex shrink-0 items-center gap-1">
                  <Image
                    src={match.championIconUrl}
                    alt={match.championName}
                    width={40}
                    height={40}
                    unoptimized
                    className="rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-0.5">
                    {[match.spell1IconUrl, match.spell2IconUrl].map((src, i) =>
                      src ? (
                        <Image
                          key={i}
                          src={src}
                          alt=""
                          width={18}
                          height={18}
                          unoptimized
                          className="rounded-sm"
                        />
                      ) : (
                        <div key={i} className="h-[18px] w-[18px] rounded-sm bg-obsidian-800" />
                      )
                    )}
                    {[match.keystoneIconUrl, match.subTreeIconUrl].map((src, i) =>
                      src ? (
                        <Image
                          key={i}
                          src={src}
                          alt=""
                          width={18}
                          height={18}
                          unoptimized
                          className="rounded-full bg-obsidian-950"
                        />
                      ) : (
                        <div
                          key={i}
                          className="h-[18px] w-[18px] rounded-full bg-obsidian-800"
                        />
                      )
                    )}
                  </div>
                </div>

                {/* vs rival */}
                {match.opponentChampionIconUrl && (
                  <div className="hidden shrink-0 items-center gap-1 sm:flex">
                    <span className="font-mono text-[11px] text-ink-muted">vs</span>
                    <Image
                      src={match.opponentChampionIconUrl}
                      alt={match.opponentChampionName ?? ""}
                      width={24}
                      height={24}
                      unoptimized
                      className="rounded-lg opacity-70"
                    />
                  </div>
                )}

                {/* KDA */}
                <div className="w-28 shrink-0">
                  <p className="font-mono text-sm font-semibold">
                    {match.kills}/{match.deaths}/{match.assists}
                  </p>
                  <p className="font-mono text-[11px] text-ink-muted">
                    {kda.toFixed(1)} KDA
                    {match.killParticipation != null &&
                      ` · ${Math.round(match.killParticipation * 100)}% KP`}
                    {" · "}
                    {match.cs} CS
                  </p>
                </div>

                {/* items */}
                <div className="hidden shrink-0 gap-0.5 sm:flex">
                  {match.itemIconUrls.map((src, i) =>
                    src ? (
                      <Image
                        key={i}
                        src={src}
                        alt=""
                        width={22}
                        height={22}
                        unoptimized
                        className="rounded-sm"
                      />
                    ) : (
                      <div key={i} className="h-[22px] w-[22px] rounded-sm bg-obsidian-800" />
                    )
                  )}
                </div>

                {/* LP */}
                <div className="ml-auto shrink-0 text-right">
                  {match.lpDelta != null ? (
                    <p
                      className={cn(
                        "font-mono text-sm font-semibold",
                        match.lpDelta >= 0 ? "text-win" : "text-loss"
                      )}
                    >
                      {match.lpDelta >= 0 ? "+" : ""}
                      {match.lpDelta} LP
                    </p>
                  ) : (
                    <p className="font-mono text-sm text-ink-muted">— LP</p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
