import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { TierBadge } from "@/components/ladder/TierBadge";
import { RecentFormStrip } from "@/components/ladder/RecentFormStrip";
import { RoleIcon } from "@/components/ladder/RoleIcon";
import { StreakBadge } from "@/components/ladder/StreakBadge";
import { LiveIndicator } from "@/components/ladder/LiveIndicator";
import { WinLossBar } from "@/components/ui/Bar";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import type { PodiumEntry } from "@/lib/ranking/public-summary";
import { tierGlowVar, winrate } from "@/lib/ranking/lp-math";
import { championSplashUrl } from "@/lib/riot/ddragon";
import { cn } from "@/lib/utils/cn";

// Orden visual clásico de podio: 2do a la izquierda, 1ro al centro, 3ro a la derecha.
const PODIUM_VISUAL_ORDER = [1, 0, 2];

/**
 * Alturas reales por puesto. Antes las tres tarjetas medían exactamente lo
 * mismo, así que el `items-end` del contenedor no producía ningún escalón y
 * el podio no se leía como podio.
 */
const PLACE_STYLES = {
  1: { card: "sm:pt-10 sm:pb-8", art: "h-40 sm:h-52", number: "text-6xl sm:text-7xl" },
  2: { card: "sm:pt-6 sm:pb-8", art: "h-32 sm:h-40", number: "text-5xl sm:text-6xl" },
  3: { card: "sm:pt-4 sm:pb-8", art: "h-28 sm:h-36", number: "text-5xl sm:text-6xl" },
} as const;

/**
 * El orden 2-1-3 solo se sostiene con las tarjetas lado a lado. Apiladas en
 * móvil dejaba al segundo puesto arriba del primero, así que ahí se reordena
 * a 1-2-3 con `order` y se vuelve al orden del DOM desde `sm`.
 */
const PLACE_ORDER = {
  1: "order-1 sm:order-none",
  2: "order-2 sm:order-none",
  3: "order-3 sm:order-none",
} as const;

export function PodiumHero({ entries }: { entries: PodiumEntry[] }) {
  const top3 = entries.slice(0, 3);

  if (top3.length === 0) {
    return (
      <Panel className="flex flex-col items-center gap-2 px-6 py-10 text-center">
        <Crown size={28} className="text-ink-muted" aria-hidden />
        <p className="font-display text-xl uppercase tracking-wide text-ink">Podio vacío</p>
        <p className="max-w-sm font-body text-sm text-ink-muted">
          Todavía nadie tiene partidas registradas esta temporada. En cuanto alguien juegue una
          ranked, aparece acá.
        </p>
      </Panel>
    );
  }

  return (
    <Stagger className="flex w-full flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-end">
      {PODIUM_VISUAL_ORDER.map((idx) => {
        const entry = top3[idx];
        if (!entry) return null;
        return <PodiumCard key={entry.id} entry={entry} place={idx + 1} />;
      })}
    </Stagger>
  );
}

function PodiumCard({ entry, place }: { entry: PodiumEntry; place: number }) {
  const styles = PLACE_STYLES[place as 1 | 2 | 3];
  const glow = entry.tier ? tierGlowVar(entry.tier) : undefined;
  const wr = winrate(entry.wins, entry.losses);
  const hasRecord = entry.wins + entry.losses > 0;

  return (
    <StaggerItem className={cn("sm:w-56", PLACE_ORDER[place as 1 | 2 | 3])}>
      <Link href={`/jugador/${entry.slug}`} className="focus-ring block rounded-panel">
        <Panel
          glowColor={glow}
          className={cn(
            "relative flex h-full flex-col items-center gap-3 overflow-hidden px-4 pt-6 pb-6",
            styles.card
          )}
        >
          {/* Splash del campeón principal como textura ambiente: teñido al
              color del tier y desvanecido con .splash-veil para que el texto
              de encima siga legible. */}
          {entry.topChampion && (
            <div
              className={cn(
                "splash-veil pointer-events-none absolute inset-x-0 top-0 opacity-[0.14]",
                styles.art
              )}
              aria-hidden
            >
              <Image
                src={championSplashUrl(entry.topChampion.championName)}
                alt=""
                fill
                unoptimized
                sizes="224px"
                className="object-cover object-top"
              />
            </div>
          )}

          <div className="relative flex w-full flex-col items-center gap-2">
            <span
              className={cn(
                "font-display leading-none",
                styles.number,
                place === 1 ? "text-[var(--glow-color,var(--color-accent))]" : "text-ink-muted"
              )}
              style={glow ? { "--glow-color": glow } as React.CSSProperties : undefined}
            >
              {place}
            </span>

            {place === 1 && (
              <Crown size={18} className="text-tier-challenger" aria-label="Primer lugar" />
            )}

            <span className="line-clamp-2 text-center font-body text-lg font-semibold text-ink">
              {entry.name}
            </span>

            {entry.isLive && <LiveIndicator compact />}

            {entry.tier && entry.leaguePoints !== null ? (
              <div className="flex flex-col items-center gap-1">
                <TierBadge
                  tier={entry.tier}
                  division={entry.division}
                  size="sm"
                />
                <span className="font-mono text-xs text-ink-muted">
                  <AnimatedNumber value={entry.leaguePoints} /> LP
                </span>
              </div>
            ) : (
              <span className="font-mono text-xs text-ink-muted">Sin datos</span>
            )}

            {hasRecord && (
              <div className="flex w-full flex-col items-center gap-1.5 pt-1">
                <span className="font-mono text-[11px] text-ink-muted tabular">
                  {entry.wins}V {entry.losses}D · {wr}% WR
                </span>
                <WinLossBar wins={entry.wins} losses={entry.losses} size="sm" />
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {entry.preferredRole && <RoleIcon role={entry.preferredRole} showLabel={false} />}
              <StreakBadge streak={entry.streak} />
            </div>

            <RecentFormStrip results={entry.recentForm} />
          </div>
        </Panel>
      </Link>
    </StaggerItem>
  );
}
