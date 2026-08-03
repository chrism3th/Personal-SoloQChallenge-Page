export type Streak = { result: "W" | "L" | null; count: number };

/** Racha de victorias más larga dentro de la lista de partidas (orden no importa). */
export function computeBestWinStreak(matches: { win: boolean }[]): number {
  let best = 0;
  let current = 0;
  for (const match of matches) {
    current = match.win ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}

/**
 * Recibe partidas ya ordenadas de más reciente a más antigua y cuenta la
 * racha de resultados idénticos consecutivos desde la más reciente.
 */
export function computeStreak(matches: { win: boolean }[]): Streak {
  if (matches.length === 0) return { result: null, count: 0 };

  const latestResult = matches[0].win;
  let count = 0;
  for (const match of matches) {
    if (match.win !== latestResult) break;
    count++;
  }

  return { result: latestResult ? "W" : "L", count };
}
