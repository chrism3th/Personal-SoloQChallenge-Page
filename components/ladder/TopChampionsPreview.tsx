import Image from "next/image";
import { championIconUrl } from "@/lib/riot/ddragon";

export function TopChampionsPreview({
  champions,
  version,
  size = 24,
}: {
  champions: { championName: string; games: number }[];
  version: string;
  size?: number;
}) {
  if (champions.length === 0) {
    return <span className="font-mono text-xs text-ink-muted">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {champions.map((champ) => (
        <Image
          key={champ.championName}
          src={championIconUrl(version, champ.championName)}
          alt={`${champ.championName} (${champ.games}j)`}
          title={`${champ.championName} · ${champ.games}j`}
          width={size}
          height={size}
          unoptimized
          className="rounded-md border border-obsidian-700"
        />
      ))}
    </div>
  );
}
