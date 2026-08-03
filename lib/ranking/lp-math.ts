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

/** Ancho exacto de un tier en la escala de rankValue() — ver la fórmula abajo. */
const UNITS_PER_TIER = 10_000;

/** Tier al que pertenece un rankValue, acotado a los extremos de la escala. */
export function tierFromRankValue(value: number): Tier {
  const index = Math.floor(value / UNITS_PER_TIER);
  return TIER_ORDER[Math.max(0, Math.min(TIER_ORDER.length - 1, index))];
}

const DIVISION_BY_WEIGHT: Exclude<Division, null>[] = ["IV", "III", "II", "I"];

/**
 * Etiqueta legible de un rankValue (ej. 61_000 -> "Diamond III").
 *
 * Sirve para rotular un punto del gráfico sin arrastrar el snapshot original:
 * la escala es reversible porque cada tier ocupa 10.000 unidades y cada
 * división 1.000 dentro de ese bloque.
 */
export function rankLabelFromValue(value: number): string {
  const tier = tierFromRankValue(value);
  if (!hasDivision(tier)) return tier.charAt(0) + tier.slice(1).toLowerCase();

  const divisionWeight = Math.floor((value % UNITS_PER_TIER) / 1_000);
  const division = DIVISION_BY_WEIGHT[Math.max(0, Math.min(3, divisionWeight))];
  return formatTierDivision(tier, division);
}

export type TierBand = { tier: Tier; y1: number; y2: number; color: string };

/**
 * Franjas horizontales de tier que cubren el rango [min, max] de un gráfico de
 * progresión, para pintarlas de fondo con `ReferenceArea`.
 *
 * Funciona porque rankValue() usa exactamente 10.000 unidades por tier, así
 * que los límites caen en múltiplos redondos y no hay que inferir nada: la
 * línea de LP deja de ser una curva abstracta y pasa a leerse como "por qué
 * tier iba" en cada momento.
 */
export function tierBands(min: number, max: number): TierBand[] {
  const firstIndex = Math.max(0, Math.floor(min / UNITS_PER_TIER));
  const lastIndex = Math.min(TIER_ORDER.length - 1, Math.floor(max / UNITS_PER_TIER));

  const bands: TierBand[] = [];
  for (let i = firstIndex; i <= lastIndex; i++) {
    const tier = TIER_ORDER[i];
    bands.push({
      tier,
      // Se recortan a la ventana visible para que la banda de los extremos no
      // se dibuje fuera del área del gráfico.
      y1: Math.max(min, i * UNITS_PER_TIER),
      y2: Math.min(max, (i + 1) * UNITS_PER_TIER),
      color: tierGlowVar(tier),
    });
  }
  return bands;
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
