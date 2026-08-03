export function formatDateRange(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startLabel = start.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
  if (!endsAt) return `Desde el ${startLabel}`;
  const end = new Date(endsAt);
  const endLabel = end.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  return `${startLabel} — ${endLabel}`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays} d`;
}

export function formatGameDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

/** Formato compacto para oro/daño (ej. 15030 -> "15.0k"). */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1)}k`;
}

/**
 * Número con signo explícito, incluido el "+" de los positivos (ej. "+12").
 * El delta de LP se armaba a mano con el mismo ternario en tres lugares.
 */
export function formatSigned(value: number, suffix = ""): string {
  return `${value >= 0 ? "+" : ""}${value}${suffix}`;
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/** Ratio de KDA; con 0 muertes se devuelve el "perfect" habitual de LoL. */
export function formatKda(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) return "Perfecto";
  return ((kills + assists) / deaths).toFixed(2);
}

export function formatCsPerMin(cs: number, gameDurationSeconds: number): string {
  if (gameDurationSeconds <= 0) return "—";
  return (cs / (gameDurationSeconds / 60)).toFixed(1);
}

/** Ordinal en español para los puestos del podio y el salón de la fama. */
export function formatOrdinal(n: number): string {
  return `${n}º`;
}
