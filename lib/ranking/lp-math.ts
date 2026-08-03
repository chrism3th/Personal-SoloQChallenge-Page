import type { Division, Tier } from "@/lib/supabase/types";

const TIER_WEIGHT: Record<Tier, number> = {
  IRON: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  EMERALD: 5,
  DIAMOND: 6,
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
};

const DIVISION_WEIGHT: Record<Exclude<Division, null>, number> = {
  IV: 0,
  III: 1,
  II: 2,
  I: 3,
};

export const TIER_ORDER: Tier[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

/** Tiers Master+ no tienen división y el LP puede superar 100 libremente. */
export function hasDivision(tier: Tier): boolean {
  return tier !== "MASTER" && tier !== "GRANDMASTER" && tier !== "CHALLENGER";
}

const TIER_SLUG: Record<Tier, string> = {
  IRON: "iron",
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
  EMERALD: "emerald",
  DIAMOND: "diamond",
  MASTER: "master",
  GRANDMASTER: "grandmaster",
  CHALLENGER: "challenger",
};

/** CSS var del color real de un tier (definido en app/globals.css) — el halo de cada jugador es su propio color de rango. */
export function tierGlowVar(tier: Tier): string {
  return `var(--color-tier-${TIER_SLUG[tier]})`;
}

/**
 * Convierte tier + división + LP a un único valor numérico comparable,
 * usado para ordenar el ladder y calcular deltas entre snapshots.
 * Debe mantenerse en sync con la fórmula replicada en SQL dentro de
 * supabase/migrations/0002_rls_policies.sql (función close_season).
 */
export function rankValue(tier: Tier, division: Division, leaguePoints: number): number {
  const tierWeight = TIER_WEIGHT[tier] ?? 0;
  const divisionWeight = division ? DIVISION_WEIGHT[division] ?? 0 : 0;
  return tierWeight * 10_000 + divisionWeight * 1_000 + leaguePoints;
}

export function formatTierDivision(tier: Tier, division: Division): string {
  const label = tier.charAt(0) + tier.slice(1).toLowerCase();
  return hasDivision(tier) && division ? `${label} ${division}` : label;
}

export function winrate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}

/**
 * Estima el LP ganado/perdido en una partida puntual, comparando los dos
 * snapshots de LP consecutivos que la "envuelven" (uno tomado antes de
 * jugarla, el siguiente después). Solo se anima a dar un número cuando:
 * - hay exactamente una partida entre esos dos snapshots (si hubo más de
 *   una, no se puede saber cuánto aportó cada una por separado), y
 * - el tier y la división no cambiaron entre ambos snapshots (un ascenso/
 *   descenso de división resetea la escala de LP, restar directamente
 *   daría un número sin sentido).
 * Cuando no se cumplen esas condiciones, la partida queda sin dato (null)
 * — mejor no mostrar nada que mostrar un número inventado.
 */
export function computeMatchLpDeltas(
  matches: { id: string; gameCreation: string }[],
  snapshotsAsc: { takenAt: string; tier: Tier; division: Division; leaguePoints: number }[]
): Map<string, number | null> {
  const deltas = new Map<string, number | null>();

  for (let i = 0; i < snapshotsAsc.length - 1; i++) {
    const before = snapshotsAsc[i];
    const after = snapshotsAsc[i + 1];

    const matchesInWindow = matches.filter(
      (m) => m.gameCreation > before.takenAt && m.gameCreation <= after.takenAt
    );
    if (matchesInWindow.length !== 1) continue;
    if (before.tier !== after.tier || before.division !== after.division) continue;

    deltas.set(matchesInWindow[0].id, after.leaguePoints - before.leaguePoints);
  }

  return deltas;
}
