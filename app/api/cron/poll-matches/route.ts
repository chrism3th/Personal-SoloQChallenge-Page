import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { markRiotKeyValid } from "@/lib/riot/client";
import { pollProfileMatches } from "@/lib/riot/poll";

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * Cron cada ~12 min: actualiza LP/rango y partidas nuevas de todos los
 * perfiles activos, secuencialmente contra el rate limiter compartido de
 * lib/riot/rate-limiter.ts. Protegido por CRON_SECRET (lo envía Vercel
 * Cron en el header Authorization).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];
  let hitInvalidKey = false;

  for (const profile of profiles ?? []) {
    if (hitInvalidKey) break;
    const result = await pollProfileMatches(supabase, profile);
    results.push(result);
    if (result.error?.includes("inválida o expirada")) {
      hitInvalidKey = true;
    }
  }

  if (!hitInvalidKey && (profiles?.length ?? 0) > 0) {
    await markRiotKeyValid();
  }

  return NextResponse.json({
    processed: results.length,
    snapshotsInserted: results.filter((r) => r.snapshotInserted).length,
    newMatches: results.reduce((sum, r) => sum + r.newMatches, 0),
    errors: results
      .filter((r) => r.error)
      .map((r) => ({ profileId: r.profileId, error: r.error })),
    keyStatus: hitInvalidKey ? "invalid" : "valid",
  });
}
