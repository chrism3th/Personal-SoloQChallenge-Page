/**
 * Smoke test de las políticas RLS definidas en
 * supabase/migrations/0002_rls_policies.sql. Corre contra Supabase local
 * después de `supabase db reset` + `npx tsx scripts/seed-fake-data.ts`.
 *
 * Uso: npx tsx scripts/verify-rls.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("Faltan variables de Supabase en el entorno (.env.local).");
  process.exit(1);
}

// El segundo amigo seedeado por seed-fake-data.ts no es admin.
const NON_ADMIN_EMAIL = "nacho@example.test";
const NON_ADMIN_PASSWORD = "arena12345";

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`✓ ${label}`);
    passed++;
  } else {
    console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function main() {
  const admin = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anon = createClient<Database>(SUPABASE_URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Cliente anónimo (sin sesión) no debería poder leer profiles.
  const { data: anonProfiles } = await anon.from("profiles").select("*");
  check(
    "anon sin sesión no puede leer profiles",
    !anonProfiles || anonProfiles.length === 0,
    `trajo ${anonProfiles?.length ?? 0} filas`
  );

  // 2. anon no puede leer app_settings (contiene la Riot API key).
  const { data: anonSettings, error: anonSettingsError } = await anon
    .from("app_settings")
    .select("*")
    .maybeSingle();
  check(
    "anon sin sesión no puede leer app_settings",
    !anonSettings,
    anonSettingsError ? undefined : "select devolvió datos"
  );

  // 3. Login como un usuario no-admin.
  const nonAdmin = createClient<Database>(SUPABASE_URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signIn, error: signInError } = await nonAdmin.auth.signInWithPassword({
    email: NON_ADMIN_EMAIL,
    password: NON_ADMIN_PASSWORD,
  });
  if (signInError || !signIn.user) {
    console.error(
      `No se pudo autenticar como ${NON_ADMIN_EMAIL}. ¿Corriste seed-fake-data.ts antes?`,
      signInError?.message
    );
    process.exit(1);
  }
  const userId = signIn.user.id;

  // 4. Usuario autenticado (no-admin) SÍ debe poder leer el ladder completo.
  const { data: authedProfiles } = await nonAdmin.from("profiles").select("*");
  check(
    "usuario autenticado puede leer profiles (ladder)",
    (authedProfiles?.length ?? 0) > 0
  );

  // 5. Usuario no-admin NO puede auto-otorgarse is_admin.
  await nonAdmin.from("profiles").update({ is_admin: true }).eq("id", userId);
  const { data: selfProfile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  check("usuario no-admin no puede auto-otorgarse is_admin", selfProfile?.is_admin === false);

  // 6. Usuario no-admin no puede insertar invites.
  const { error: inviteInsertError } = await nonAdmin.from("invites").insert({
    code: "HACKED01",
    created_by: userId,
  });
  check("usuario no-admin no puede crear invites", Boolean(inviteInsertError));

  // 7. Usuario no-admin no puede escribir en app_settings.
  // OJO: un UPDATE bloqueado por RLS no devuelve error — Postgres/PostgREST
  // simplemente no encuentra filas visibles para hacer match y afecta 0
  // filas en silencio. Por eso se re-verifica el valor real con el
  // cliente admin en vez de confiar en `error`.
  await nonAdmin.from("app_settings").update({ riot_api_key: "hacked" }).eq("id", true);
  const { data: settingsAfter } = await admin
    .from("app_settings")
    .select("riot_api_key")
    .eq("id", true)
    .single();
  check(
    "usuario no-admin no puede editar app_settings",
    settingsAfter?.riot_api_key !== "hacked"
  );

  // 8. Usuario no-admin no puede escribir directamente en lp_snapshots (esa tabla solo la escribe el cron con service_role).
  const { error: snapshotInsertError } = await nonAdmin.from("lp_snapshots").insert({
    profile_id: userId,
    tier: "CHALLENGER",
    division: null,
    league_points: 9999,
    wins: 999,
    losses: 0,
  });
  check("usuario no-admin no puede insertar lp_snapshots", Boolean(snapshotInsertError));

  // 9. El cliente service_role sí puede escribir en lp_snapshots (bypass de RLS esperado).
  const { error: adminSnapshotError } = await admin.from("lp_snapshots").insert({
    profile_id: userId,
    tier: "GOLD",
    division: "II",
    league_points: 42,
    wins: 10,
    losses: 8,
  });
  check("service_role sí puede insertar lp_snapshots (cron)", !adminSnapshotError);

  console.log(`\n${passed} ok / ${failed} fallidas`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
