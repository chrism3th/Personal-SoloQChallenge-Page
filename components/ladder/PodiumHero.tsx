import Link from "next/link";
import { Panel } from "@/components/shared/Panel";
import { TierBadge } from "@/components/ladder/TierBadge";
import type { PodiumEntry } from "@/lib/ranking/public-summary";
import { tierGlowVar } from "@/lib/ranking/lp-math";

// Orden visual clásico de podio: 2do a la izquierda, 1ro al centro, 3ro a la derecha.
const PODIUM_VISUAL_ORDER = [1, 0, 2];

export function PodiumHero({ entries }: { entries: PodiumEntry[] }) {
  const top3 = entries.slice(0, 3);

  if (top3.length === 0) {
    return (
      <p className="font-body text-ink-muted">
        Todavía nadie tiene partidas registradas esta temporada.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-center gap-4">
      {PODIUM_VISUAL_ORDER.map((idx) => {
        const entry = top3[idx];
        if (!entry) return null;
        const place = idx + 1;

        return (
          <Link key={entry.id} href={`/jugador/${entry.slug}`} className="focus-ring">
            <Panel
              glowColor={entry.tier ? tierGlowVar(entry.tier) : undefined}
              className="flex w-48 flex-col items-center gap-2 px-4 py-6"
            >
              <span className="font-display text-5xl text-accent">{place}</span>
              <span className="text-center font-body text-lg font-semibold">{entry.name}</span>
              {entry.tier && entry.leaguePoints !== null ? (
                <TierBadge tier={entry.tier} division={entry.division} leaguePoints={entry.leaguePoints} size="sm" />
              ) : (
                <span className="font-mono text-xs text-ink-muted">Sin datos</span>
              )}
            </Panel>
          </Link>
        );
      })}
    </div>
  );
}
