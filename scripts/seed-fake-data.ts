/**
 * Genera datos falsos (perfiles, temporadas, snapshots de LP, partidas) para
 * poder construir y revisar toda la UI localmente sin depender de la Riot
 * API key. Pensado para correr contra una instancia local de Supabase
 * (`supabase start`), nunca contra producción.
 *
 * Uso: npx tsx scripts/seed-fake-data.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { riotIdToSlug } from "../lib/utils/slug";
import type { Database, Division, Tier } from "../lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.\n" +
      "Corre `supabase start` y copia esos valores a .env.local antes de seedear."
  );
  process.exit(1);
}

if (!SUPABASE_URL.includes("127.0.0.1") && !SUPABASE_URL.includes("localhost")) {
  console.error(
    `NEXT_PUBLIC_SUPABASE_URL apunta a "${SUPABASE_URL}", que no parece una instancia local.\n` +
      "Este script inserta datos falsos y solo debe correr contra Supabase local."
  );
  process.exit(1);
}

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TIER_ORDER: Tier[] = [
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
const DIVISIONS: Exclude<Division, null>[] = ["IV", "III", "II", "I"];

// Escala propia del generador: 100 unidades = 1 división (LP real de Riot
// va de 0 a 99), 4 divisiones = 400 unidades por tier. Independiente de
// los pesos de lib/ranking/lp-math.ts (esos se aplican sobre LP real
// 0-99, nunca necesitan decodificar un "rank_value" arbitrario de vuelta).
const UNITS_PER_DIVISION = 100;
const UNITS_PER_TIER = UNITS_PER_DIVISION * DIVISIONS.length;

function tierDivisionFromValue(value: number): { tier: Tier; division: Division; lp: number } {
  const clamped = Math.max(0, value);
  const tierIndex = Math.min(9, Math.floor(clamped / UNITS_PER_TIER));
  const tier = TIER_ORDER[tierIndex];
  const withinTier = clamped - tierIndex * UNITS_PER_TIER;

  if (tierIndex >= 7) {
    // Master+: sin división, LP libre (puede superar 100).
    return { tier, division: null, lp: withinTier };
  }

  const divisionIndex = Math.min(3, Math.floor(withinTier / UNITS_PER_DIVISION));
  const lp = withinTier - divisionIndex * UNITS_PER_DIVISION;
  return { tier, division: DIVISIONS[divisionIndex], lp };
}

const CHAMPIONS = [
  { id: 103, name: "Ahri" },
  { id: 157, name: "Yasuo" },
  { id: 64, name: "LeeSin" },
  { id: 222, name: "Jinx" },
  { id: 412, name: "Thresh" },
  { id: 238, name: "Zed" },
  { id: 99, name: "Lux" },
  { id: 254, name: "Vi" },
  { id: 81, name: "Ezreal" },
  { id: 62, name: "MonkeyKing" },
] as const;

const ROLES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

const FAKE_FRIENDS = [
  { gameName: "Pancho", tagLine: "LAS1" },
  { gameName: "Nacho", tagLine: "LAS2" },
  { gameName: "LaCata", tagLine: "LAS3" },
  { gameName: "ElToto", tagLine: "LAS4" },
  { gameName: "Fran", tagLine: "LAS5" },
  { gameName: "Seba", tagLine: "LAS6" },
  { gameName: "Camilo", tagLine: "LAS7" },
  { gameName: "Vale", tagLine: "LAS8" },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

async function main() {
  console.log(`Seedeando datos falsos contra ${SUPABASE_URL} ...`);

  const now = Date.now();
  const seasonPastStart = new Date(now - 60 * 86_400_000).toISOString();
  const seasonPastEnd = new Date(now - 30 * 86_400_000).toISOString();
  const seasonCurrentStart = new Date(now - 29 * 86_400_000).toISOString();

  // Un admin "de sistema" para created_by de las temporadas/seeds.
  const { data: systemUser, error: systemUserError } = await admin.auth.admin.createUser({
    email: "seed-system@example.test",
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (systemUserError || !systemUser.user) {
    throw new Error(`No se pudo crear el usuario de sistema: ${systemUserError?.message}`);
  }
  const systemUserId = systemUser.user.id;

  const { data: pastSeason, error: pastSeasonError } = await admin
    .from("seasons")
    .insert({
      name: "S0 · Pretemporada",
      starts_at: seasonPastStart,
      ends_at: seasonPastEnd,
      is_closed: true,
      is_current: false,
      created_by: systemUserId,
    })
    .select("*")
    .single();
  if (pastSeasonError) throw pastSeasonError;

  const { data: currentSeason, error: currentSeasonError } = await admin
    .from("seasons")
    .insert({
      name: "S1 · Split de Verano 2026",
      starts_at: seasonCurrentStart,
      is_closed: false,
      is_current: true,
      created_by: systemUserId,
    })
    .select("*")
    .single();
  if (currentSeasonError) throw currentSeasonError;

  console.log(`Temporadas creadas: "${pastSeason.name}" (cerrada) y "${currentSeason.name}" (activa).`);

  const existingSlugs = new Set<string>();

  for (const [index, friend] of FAKE_FRIENDS.entries()) {
    const email = `${friend.gameName.toLowerCase()}@example.test`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: "arena12345",
      email_confirm: true,
    });
    if (createError || !created.user) {
      console.error(`No se pudo crear usuario para ${friend.gameName}:`, createError?.message);
      continue;
    }

    const slugBase = riotIdToSlug(friend.gameName, friend.tagLine);
    const slug = existingSlugs.has(slugBase) ? `${slugBase}-2` : slugBase;
    existingSlugs.add(slug);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .insert({
        id: created.user.id,
        riot_puuid: `fake-puuid-${crypto.randomUUID()}`,
        riot_game_name: friend.gameName,
        riot_tag_line: friend.tagLine,
        slug,
        is_admin: index === 0, // el primer amigo seedeado queda como admin de prueba
      })
      .select("*")
      .single();
    if (profileError || !profile) {
      console.error(`No se pudo crear profile para ${friend.gameName}:`, profileError?.message);
      continue;
    }

    // Punto de partida de rank_value aleatorio por jugador (silver-plata a diamante).
    // Arranca entre mediados de Silver y Diamond bajo (en unidades del
    // generador: UNITS_PER_TIER=400 por tier, ver tierDivisionFromValue).
    let currentValue = randomInt(800, 2_400);
    let wins = randomInt(10, 40);
    let losses = randomInt(10, 40);

    // ~14 snapshots repartidos entre la temporada pasada y la actual.
    const totalSnapshots = 14;
    const startMs = new Date(seasonPastStart).getTime();
    const endMs = now;
    const step = (endMs - startMs) / totalSnapshots;

    for (let i = 0; i < totalSnapshots; i++) {
      const takenAt = new Date(startMs + step * i + randomInt(0, step * 0.4)).toISOString();
      // Swing de LP realista entre snapshots (1-3 partidas de +-12/25 LP c/u).
      const delta = randomInt(-40, 55);
      currentValue = Math.max(0, currentValue + delta);
      const won = delta >= 0;
      wins += won ? 1 : 0;
      losses += won ? 0 : 1;

      const { tier, division, lp } = tierDivisionFromValue(currentValue);

      const { error: snapshotError } = await admin.from("lp_snapshots").insert({
        profile_id: profile.id,
        tier,
        division,
        league_points: lp,
        wins,
        losses,
        taken_at: takenAt,
      });
      if (snapshotError) console.error("Error insertando snapshot:", snapshotError.message);

      // 1-3 partidas falsas alrededor de cada snapshot.
      const gamesThisRound = randomInt(1, 3);
      for (let g = 0; g < gamesThisRound; g++) {
        const champion = randomChoice(CHAMPIONS);
        const role = randomChoice(ROLES);
        const win = Math.random() < (won ? 0.62 : 0.38);
        const gameCreation = new Date(
          new Date(takenAt).getTime() - randomInt(0, step * 0.3)
        ).toISOString();
        const matchId = `FAKE_${profile.id.slice(0, 8)}_${i}_${g}`;

        const { error: matchError } = await admin.from("matches").insert({
          id: matchId,
          game_creation: gameCreation,
          game_duration: randomInt(1200, 2400),
          queue_id: 420,
          patch_version: "14.24.1",
        });
        if (matchError) {
          console.error("Error insertando match:", matchError.message);
          continue;
        }

        const kills = randomInt(0, 12);
        const deaths = randomInt(0, 10);
        const assists = randomInt(0, 15);

        const { error: participantError } = await admin.from("match_participants").insert({
          match_id: matchId,
          profile_id: profile.id,
          puuid: profile.riot_puuid,
          champion_id: champion.id,
          champion_name: champion.name,
          role,
          team_position: role,
          win,
          kills,
          deaths,
          assists,
          cs: randomInt(80, 260),
          vision_score: randomInt(10, 60),
        });
        if (participantError) console.error("Error insertando participante:", participantError.message);
      }
    }

    // Indicador "en vivo" falso para ~1 de cada 5 jugadores, solo para probar el badge en el ladder.
    await admin.from("live_status").upsert({
      profile_id: profile.id,
      is_live: Math.random() < 0.2,
      game_mode: "CLASSIC",
      game_start_time: new Date(now - randomInt(60_000, 900_000)).toISOString(),
      champion_id: randomChoice(CHAMPIONS).id,
    });

    console.log(`✓ ${friend.gameName}#${friend.tagLine} (/jugador/${slug})`);
  }

  console.log("\nListo. Corre `npm run dev` y revisa /, /ladder, /temporadas y /jugador/<slug>.");
  console.log(
    `El admin de prueba es "${FAKE_FRIENDS[0].gameName.toLowerCase()}@example.test" / contraseña "arena12345".`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
