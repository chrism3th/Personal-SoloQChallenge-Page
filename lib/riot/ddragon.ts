// Data Dragon es un CDN público de Riot, sin API key — se puede llamar
// tanto desde server como desde el cliente.

let cachedVersion: { version: string; fetchedAt: number } | null = null;
const VERSION_TTL_MS = 60 * 60 * 1000;

/**
 * Último recurso si Data Dragon no responde. Los íconos de una versión vieja
 * siguen sirviéndose, así que como mucho falta el arte de un campeón nuevo.
 */
const FALLBACK_VERSION = "15.1.1";

export async function getLatestDdragonVersion(): Promise<string> {
  const now = Date.now();
  if (cachedVersion && now - cachedVersion.fetchedAt < VERSION_TTL_MS) {
    return cachedVersion.version;
  }

  // Data Dragon es un CDN de terceros: si se cae, o si el entorno no tiene
  // salida a internet, esto no puede tumbar la página entera. Antes cualquier
  // fallo acá se propagaba y devolvía un 500 en todo el ladder.
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Data Dragon respondió ${res.status}`);

    const versions = (await res.json()) as string[];
    const version = versions[0];
    if (typeof version !== "string") throw new Error("Respuesta de versiones inesperada");

    cachedVersion = { version, fetchedAt: now };
    return version;
  } catch {
    // Se prefiere la última versión conocida aunque esté vencida; recién si
    // nunca hubo una se cae al valor fijo.
    return cachedVersion?.version ?? FALLBACK_VERSION;
  }
}

/**
 * `championName` debe ser la "key" interna de Data Dragon (ej. "MonkeyKing"
 * para Wukong), que coincide con el `championName` que devuelve Match-v5
 * para casi todos los campeones. Un puñado de campeones históricos tienen
 * discrepancias conocidas entre nombre público y key de Data Dragon — no
 * se resuelven en este helper; si un ícono no carga, revisar el mapeo
 * community-dragon como alternativa.
 */
export function championIconUrl(version: string, championName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championName}.png`;
}

/**
 * Splash art completo del campeón (1215x717). A diferencia de los íconos, las
 * imágenes de splash y loading NO van versionadas: viven en /cdn/img/ directo.
 * `_0` es la skin base, la única garantizada para todos los campeones.
 *
 * Se usa como textura ambiente detrás de paneles (con `.splash-veil`), nunca
 * como imagen de contenido — de ahí que no haga falta resolver la skin real.
 */
export function championSplashUrl(championName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_0.jpg`;
}

/** Retrato vertical (308x560), útil para tarjetas angostas como las del podio. */
export function championLoadingUrl(championName: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championName}_0.jpg`;
}

export function profileIconUrl(version: string, profileIconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`;
}

// ---------------------------------------------------------------------
// Campeones por id numérico: champion.json está indexado por key interna
// ("Ahri"), con el id numérico dentro de cada entrada como string. Igual que
// con los hechizos de invocador, hay que invertir el mapeo una vez y
// cachearlo por versión.
//
// Lo necesita live_status.champion_id, que guarda el id numérico que devuelve
// el endpoint de spectator y hasta ahora no se podía traducir a nada
// mostrable.
// ---------------------------------------------------------------------
let cachedChampionMap: { version: string; map: Map<number, string> } | null = null;

async function getChampionIdMap(version: string): Promise<Map<number, string>> {
  if (cachedChampionMap?.version === version) return cachedChampionMap.map;

  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Data Dragon respondió ${res.status}`);

    const json = (await res.json()) as {
      data: Record<string, { key: string; id: string }>;
    };

    const map = new Map<number, string>();
    for (const entry of Object.values(json.data)) {
      map.set(Number(entry.key), entry.id);
    }

    cachedChampionMap = { version, map };
    return map;
  } catch {
    return new Map();
  }
}

/** Key interna del campeón (ej. "Ahri") a partir del id numérico de Riot. */
export async function getChampionNameById(
  version: string,
  championId: number | null
): Promise<string | null> {
  if (!championId) return null;
  const map = await getChampionIdMap(version);
  return map.get(championId) ?? null;
}

export function itemIconUrl(version: string, itemId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

// ---------------------------------------------------------------------
// Hechizos de invocador: summoner.json mapea por nombre interno, no por
// id — hay que invertir el mapeo una vez y cachearlo por versión.
// ---------------------------------------------------------------------
let cachedSpellMap: { version: string; map: Map<number, string> } | null = null;

async function getSummonerSpellMap(version: string): Promise<Map<number, string>> {
  if (cachedSpellMap?.version === version) return cachedSpellMap.map;

  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Data Dragon respondió ${res.status}`);

    const json = (await res.json()) as {
      data: Record<string, { key: string; image: { full: string } }>;
    };

    const map = new Map<number, string>();
    for (const entry of Object.values(json.data)) {
      map.set(Number(entry.key), entry.image.full);
    }

    cachedSpellMap = { version, map };
    return map;
  } catch {
    // Mapa vacío = los consumidores devuelven null y la UI muestra el hueco
    // del ícono. No se cachea, para reintentar en la próxima llamada.
    return new Map();
  }
}

export async function summonerSpellIconUrl(
  version: string,
  spellId: number | null
): Promise<string | null> {
  if (!spellId) return null;
  const map = await getSummonerSpellMap(version);
  const fileName = map.get(spellId);
  return fileName ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${fileName}` : null;
}

// ---------------------------------------------------------------------
// Runas: runesReforged.json trae tanto los árboles (Domination, etc.)
// como cada perk individual (keystones e incluso los stat shards no
// están acá, esos se ignoran) — se aplana todo id -> icon en un solo mapa.
// El icon path NO va versionado, vive en /cdn/img/ directo.
// ---------------------------------------------------------------------
type RuneTree = {
  id: number;
  icon: string;
  slots: { runes: { id: number; icon: string }[] }[];
};

let cachedRuneMap: { version: string; map: Map<number, string> } | null = null;

async function getRuneIconMap(version: string): Promise<Map<number, string>> {
  if (cachedRuneMap?.version === version) return cachedRuneMap.map;

  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Data Dragon respondió ${res.status}`);

    const trees = (await res.json()) as RuneTree[];

    const map = new Map<number, string>();
    for (const tree of trees) {
      map.set(tree.id, tree.icon);
      for (const slot of tree.slots) {
        for (const rune of slot.runes) {
          map.set(rune.id, rune.icon);
        }
      }
    }

    cachedRuneMap = { version, map };
    return map;
  } catch {
    return new Map();
  }
}

export async function runeIconUrl(version: string, runeId: number | null): Promise<string | null> {
  if (!runeId) return null;
  const map = await getRuneIconMap(version);
  const iconPath = map.get(runeId);
  return iconPath ? `https://ddragon.leagueoflegends.com/cdn/img/${iconPath}` : null;
}

const TIER_ICON_SLUG: Record<string, string> = {
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

/**
 * Emblemas de rango — CommunityDragon expone assets por tier que Data
 * Dragon no incluye directamente. Se usa el set "mini-crests" en SVG (no
 * el de "ranked-emblem/emblem-*.png", que son renders de 2560x1440 con
 * fondo blanco pensados para pantallas de fin de partida, no íconos): los
 * mini-crests están recortados a la insignia sola con fondo transparente,
 * y existen como SVG para las 10 tiers (el set en PNG no incluye emerald).
 */
export function tierEmblemUrl(tier: string): string {
  const slug = TIER_ICON_SLUG[tier] ?? "iron";
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${slug}.svg`;
}
