import { Flame, Snowflake } from "lucide-react";
import type { Streak } from "@/lib/ranking/streak";
import { Badge } from "@/components/ui/Badge";

export function StreakBadge({
  streak,
  size = "sm",
}: {
  streak: Streak;
  size?: "sm" | "md";
}) {
  if (!streak.result || streak.count === 0) {
    return <span className="font-mono text-xs text-ink-muted">—</span>;
  }

  const isWin = streak.result === "W";
  const Icon = isWin ? Flame : Snowflake;

  return (
    <Badge
      tone={isWin ? "win" : "loss"}
      size={size}
      title={isWin ? `${streak.count} victorias seguidas` : `${streak.count} derrotas seguidas`}
    >
      <Icon size={size === "sm" ? 10 : 12} aria-hidden />
      <span className="tabular">
        {streak.count}
        {streak.result}
      </span>
    </Badge>
  );
}
