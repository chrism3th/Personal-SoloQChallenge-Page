import Image from "next/image";
import { championIconUrl } from "@/lib/riot/ddragon";
import { cn } from "@/lib/utils/cn";

type PreviewChampion = { championName: string; games: number; wins: number };

/**
 * Campeones más jugados como íconos superpuestos, cada uno con un anillo que
 * codifica su winrate y un contador de partidas. Antes eran tres íconos
 * sueltos sin más información que el `title`.
 *
 * El anillo se dibuja con un `conic-gradient` sobre el borde del ícono: es un
 * medidor real (la porción coloreada es el % de victorias) sin necesidad de
 * SVG ni de un componente aparte.
 */
export function TopChampionsPreview({
  champions,
  version,
  size = 26,
}: {
  champions: PreviewChampion[];
  version: string;
  size?: number;
}) {
  if (champions.length === 0) {
    return <span className="font-mono text-xs text-ink-muted">—</span>;
  }

  return (
    <div className="flex items-center">
      {champions.map((champ, index) => {
        const wr = champ.games > 0 ? Math.round((champ.wins / champ.games) * 100) : 0;
        const ringColor = wr >= 50 ? "var(--color-win)" : "var(--color-loss)";

        return (
          <span
            key={champ.championName}
            title={`${champ.championName} · ${champ.games}j · ${wr}% WR`}
            className={cn("relative shrink-0 rounded-full p-[2px]", index > 0 && "-ml-2")}
            style={{
              // El resto del anillo queda en obsidian para que se lea como un
              // medidor incompleto y no como un borde de color a secas.
              background: `conic-gradient(${ringColor} ${wr}%, var(--color-obsidian-700) ${wr}% 100%)`,
              zIndex: champions.length - index,
            }}
          >
            <Image
              src={championIconUrl(version, champ.championName)}
              alt={champ.championName}
              width={size}
              height={size}
              unoptimized
              className="block rounded-full border border-obsidian-900"
            />
            <span className="absolute -bottom-1 -right-1 rounded-full border border-obsidian-700 bg-obsidian-900 px-1 font-mono text-[9px] leading-tight text-ink-muted tabular">
              {champ.games}
            </span>
          </span>
        );
      })}
    </div>
  );
}
