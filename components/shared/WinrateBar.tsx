import { cn } from "@/lib/utils/cn";

export function WinrateBar({
  wins,
  losses,
  className,
}: {
  wins: number;
  losses: number;
  className?: string;
}) {
  const total = wins + losses;
  const winPct = total === 0 ? 0 : (wins / total) * 100;

  return (
    <div
      className={cn("flex h-2 w-full overflow-hidden rounded-full bg-obsidian-800", className)}
      role="img"
      aria-label={`${wins} victorias, ${losses} derrotas`}
    >
      <div className="h-full bg-win" style={{ width: `${winPct}%` }} />
      <div className="h-full bg-loss" style={{ width: `${100 - winPct}%` }} />
    </div>
  );
}
