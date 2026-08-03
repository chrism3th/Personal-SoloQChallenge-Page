import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateRiotSettingsCache } from "@/lib/riot/client";
import { getAccountByPuuid } from "@/lib/riot/account";

const BodySchema = z.object({ riotApiKey: z.string().min(10) });

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, riot_puuid")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { ok: false as const, status: 403 };
  return { ok: true as const, profile };
}

/** Guarda una Riot API key nueva y opcionalmente la prueba con un ping real. */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "No autorizado" }, { status: guard.status });

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Key inválida." }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin
    .from("app_settings")
    .update({
      riot_api_key: parsed.data.riotApiKey,
      riot_api_key_status: "unknown",
      riot_api_key_updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  invalidateRiotSettingsCache();

  let pingOk: boolean | null = null;
  if (guard.profile.riot_puuid) {
    try {
      await getAccountByPuuid(guard.profile.riot_puuid);
      pingOk = true;
      await admin.from("app_settings").update({ riot_api_key_status: "valid" }).eq("id", true);
    } catch {
      pingOk = false;
    }
  }

  return NextResponse.json({ ok: true, pingOk });
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: "No autorizado" }, { status: guard.status });

  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("riot_api_key_status, riot_api_key_updated_at")
    .eq("id", true)
    .single();

  return NextResponse.json({ settings: data });
}
