import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { riotRateLimiter } from "./rate-limiter";

export class RiotApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "RiotApiError";
    this.status = status;
  }
}

type CachedSettings = { key: string; platform: string; regional: string };

let cachedSettings: CachedSettings | null = null;
let cachedAt = 0;
const SETTINGS_TTL_MS = 30_000;

async function getRiotSettings(): Promise<CachedSettings> {
  const now = Date.now();
  if (cachedSettings && now - cachedAt < SETTINGS_TTL_MS) return cachedSettings;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("riot_api_key, platform_routing, regional_routing")
    .eq("id", true)
    .single();

  if (error || !data) {
    throw new Error("No se pudo leer la Riot API key desde app_settings");
  }

  cachedSettings = {
    key: data.riot_api_key,
    platform: data.platform_routing,
    regional: data.regional_routing,
  };
  cachedAt = now;
  return cachedSettings;
}

/** Se llama tras guardar una key nueva en /admin/api-key, para no esperar el TTL de 30s. */
export function invalidateRiotSettingsCache() {
  cachedSettings = null;
}

/** Se llama explícitamente (ping de prueba en admin, o al cerrar un ciclo de cron sin errores 401/403). */
export async function markRiotKeyValid() {
  const supabase = createAdminClient();
  await supabase.from("app_settings").update({ riot_api_key_status: "valid" }).eq("id", true);
}

async function markRiotKeyInvalid() {
  const supabase = createAdminClient();
  await supabase.from("app_settings").update({ riot_api_key_status: "invalid" }).eq("id", true);
}

async function riotFetch<T>(
  routing: "platform" | "regional",
  path: string,
  { retries = 3 }: { retries?: number } = {}
): Promise<T> {
  const settings = await getRiotSettings();
  const host = routing === "platform" ? settings.platform : settings.regional;
  const url = `https://${host}.api.riotgames.com${path}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    await riotRateLimiter.acquire();

    const res = await fetch(url, {
      headers: { "X-Riot-Token": settings.key },
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      await markRiotKeyInvalid();
      throw new RiotApiError(res.status, "Riot API key inválida o expirada");
    }

    if (res.status === 404) {
      throw new RiotApiError(404, `No encontrado: ${path}`);
    }

    if (res.status === 429) {
      if (attempt === retries) {
        throw new RiotApiError(429, "Rate limit de Riot excedido");
      }
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfterMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : 1000 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
      continue;
    }

    if (!res.ok) {
      if (attempt === retries) {
        throw new RiotApiError(res.status, `Riot API error ${res.status} en ${path}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      continue;
    }

    return (await res.json()) as T;
  }

  throw new RiotApiError(500, "riotFetch: se agotaron los reintentos");
}

export const riot = {
  platform: <T>(path: string) => riotFetch<T>("platform", path),
  regional: <T>(path: string) => riotFetch<T>("regional", path),
};
