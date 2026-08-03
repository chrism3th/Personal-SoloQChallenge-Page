/** "Pepito" + "LAS1" -> "pepito-las1", apto para /jugador/[handle]. */
export function riotIdToSlug(gameName: string, tagLine: string): string {
  const base = `${gameName}-${tagLine}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (diacríticos combinantes tras NFD)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base;
}

/** Agrega un sufijo numérico si el slug base ya existe (colisión). */
export function dedupeSlug(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
