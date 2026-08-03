import Image from "next/image";
import { Panel } from "@/components/shared/Panel";
import { TierBadge } from "@/components/ladder/TierBadge";
import { StreakBadge } from "@/components/ladder/StreakBadge";
import { WinLossBar } from "@/components/ui/Bar";
import { LpSparkline } from "./LpSparkline";
import { tierGlowVar, winrate } from "@/lib/ranking/lp-math";
import { championSplashUrl } from "@/lib/riot/ddragon";
import type { PlayerPanelData } from "@/lib/ranking/panel";
import { cn } from "@/lib/utils/cn";

export function PlayerHeader({
  profile,
  latestSnapshot,
  seasonRecord,
  streak,
  sparklineValues,
  topChampionName,
  compact = false,
}: {
  profile: PlayerPanelData["profile"];
  latestSnapshot: PlayerPanelData["latestSnapshot"];
  seasonRecord: PlayerPanelData["seasonRecord"];
  streak: PlayerPanelData["streak"];
  sparklineValues: number[];
  /** Campeón más jugado, para el splash de fondo. */
  topChampionName?: string | null;
  compact?: boolean;
}) {
  const glow = latestSnapshot ? tierGlowVar(latestSnapshot.tier) : undefined;
  const seasonGames = seasonRecord.wins + seasonRecord.losses;

  return (
    <Panel
      glowColor={glow}
      className={cn(
        "relative flex flex-wrap items-center justify-between gap-6 overflow-hidden",
        compact ? "px-5 py-5" : "px-6 py-8"
      )}
    >
      {/* Splash del campeón principal como textura ambiente. */}
      {topChampionName && (
        <div className="splash-veil pointer-events-none absolute inset-0 opacity-[0.11]" aria-hidden>
          <Image
            src={championSplashUrl(topChampionName)}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 64rem, 100vw"
            className="object-cover object-[center_20%]"
          />
        </div>
      )}

      <div className="relative flex items-center gap-4">
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
            className={cn("font-display uppercase tracking-wide", compact ? "text-3xl" : "text-5xl")}
          >
            {profile.displayName ?? profile.riotGameName}
          </h1>
          <p className="font-mono text-sm text-ink-muted">
            {profile.riotGameName}#{profile.riotTagLine}
          </p>
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-6">
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

        {seasonGames > 0 && (
          <div className="flex w-40 flex-col items-end gap-1.5">
            {/* V/D, igual que en el resto del sitio — antes acá decía "W/L". */}
            <span className="font-mono text-sm text-ink-muted tabular">
              {seasonRecord.wins}V {seasonRecord.losses}D ·{" "}
              {winrate(seasonRecord.wins, seasonRecord.losses)}% WR
            </span>
            <WinLossBar wins={seasonRecord.wins} losses={seasonRecord.losses} />
            <StreakBadge streak={streak} />
          </div>
        )}
      </div>
    </Panel>
  );
}
