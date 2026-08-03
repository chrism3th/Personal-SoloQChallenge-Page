import type { Streak } from "@/lib/ranking/streak";
import { cn } from "@/lib/utils/cn";

export function StreakBadge({ streak }: { streak: Streak }) {
  if (!streak.result || streak.count === 0) {
    return <span className="font-mono text-xs text-ink-muted">—</span>;
  }
  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold",
        streak.result === "W" ? "text-win" : "text-loss"
      )}
    >
      {streak.count}
      {streak.result}
    </span>
  );
}
