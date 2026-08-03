import Image from "next/image";
import { formatTierDivision } from "@/lib/ranking/lp-math";
import { tierEmblemUrl } from "@/lib/riot/ddragon";
import type { Division, Tier } from "@/lib/supabase/types";
import { cn } from "@/lib/utils/cn";

const TIER_TEXT_CLASS: Record<Tier, string> = {
  IRON: "text-tier-iron",
  BRONZE: "text-tier-bronze",
  SILVER: "text-tier-silver",
  GOLD: "text-tier-gold",
  PLATINUM: "text-tier-platinum",
  EMERALD: "text-tier-emerald",
  DIAMOND: "text-tier-diamond",
  MASTER: "text-tier-master",
  GRANDMASTER: "text-tier-grandmaster",
  CHALLENGER: "text-tier-challenger",
};

const TEXT_SIZE_CLASS = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
} as const;

export function TierBadge({
  tier,
  division,
  leaguePoints,
  size = "md",
}: {
  tier: Tier;
  division: Division;
  leaguePoints?: number;
  size?: "sm" | "md" | "lg";
}) {
  const dimension = size === "lg" ? 40 : size === "md" ? 28 : 20;
  return (
    <div className="flex items-center gap-2">
      <Image
        src={tierEmblemUrl(tier)}
        alt=""
        width={dimension}
        height={dimension}
        unoptimized
        className="shrink-0"
      />
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-display uppercase tracking-wide whitespace-nowrap",
            TEXT_SIZE_CLASS[size],
            TIER_TEXT_CLASS[tier]
          )}
        >
          {formatTierDivision(tier, division)}
        </span>
        {leaguePoints !== undefined && (
          <span className="font-mono text-xs text-ink-muted">{leaguePoints} LP</span>
        )}
      </div>
    </div>
  );
}
