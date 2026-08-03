import Image from "next/image";
import { Panel } from "@/components/shared/Panel";
import { TierBadge } from "@/components/ladder/TierBadge";
import { StreakBadge } from "@/components/ladder/StreakBadge";
import { WinrateBar } from "@/components/shared/WinrateBar";
import { LpSparkline } from "./LpSparkline";
import { tierGlowVar, winrate } from "@/lib/ranking/lp-math";
import type { PlayerPanelData } from "@/lib/ranking/panel";
import { cn } from "@/lib/utils/cn";

export function PlayerHeader({
  profile,
  latestSnapshot,
  streak,
  sparklineValues,
  compact = false,
}: {
  profile: PlayerPanelData["profile"];
  latestSnapshot: PlayerPanelData["latestSnapshot"];
  streak: PlayerPanelData["streak"];
  sparklineValues: number[];
  compact?: boolean;
}) {
  return (
    <Panel
      glowColor={latestSnapshot ? tierGlowVar(latestSnapshot.tier) : undefined}
      className={cn(
        "flex flex-wrap items-center justify-between gap-6",
        compact ? "px-5 py-5" : "px-6 py-8"
      )}
    >
      <div className="flex items-center gap-4">
        {profile.profileIconUrl && (
          <Image
            src={profile.profileIconUrl}
            alt=""
            width={compact ? 48 : 64}
            height={compact ? 48 : 64}
            unoptimized
            className="rounded-xl border border-obsidian-700"
          />
        )}
        <div>
          <h1
            className={cn(
              "font-display uppercase tracking-wide",
              compact ? "text-3xl" : "text-5xl"
            )}
          >
            {profile.displayName ?? profile.riotGameName}
          </h1>
          <p className="font-mono text-sm text-ink-muted">
            {profile.riotGameName}#{profile.riotTagLine}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {latestSnapshot ? (
          <TierBadge
            tier={latestSnapshot.tier}
            division={latestSnapshot.division}
            leaguePoints={latestSnapshot.leaguePoints}
            size={compact ? "md" : "lg"}
          />
        ) : (
          <span className="font-mono text-sm text-ink-muted">Sin datos aún</span>
        )}

        <LpSparkline values={sparklineValues} />

        {latestSnapshot && (
          <div className="flex w-40 flex-col items-end gap-1.5">
            <span className="font-mono text-sm text-ink-muted">
              {latestSnapshot.wins}W {latestSnapshot.losses}L ·{" "}
              {winrate(latestSnapshot.wins, latestSnapshot.losses)}% WR
            </span>
            <WinrateBar wins={latestSnapshot.wins} losses={latestSnapshot.losses} className="w-full" />
            <StreakBadge streak={streak} />
          </div>
        )}
      </div>
    </Panel>
  );
}
