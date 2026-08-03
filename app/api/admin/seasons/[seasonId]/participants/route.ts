import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";

async function requireAdminUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? { supabase } : null;
}

/** Roster de una temporada + todos los perfiles activos, para armar el checklist en /admin/temporadas. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const guard = await requireAdminUser();
  if (!guard) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { seasonId } = await params;

  const [{ data: allProfiles }, { data: roster }] = await Promise.all([
    guard.supabase
      .from("profiles")
      .select("id, slug, display_name, riot_game_name, riot_tag_line")
      .eq("is_active", true)
      .order("riot_game_name", { ascending: true }),
    guard.supabase.from("season_participants").select("profile_id").eq("season_id", seasonId),
  ]);

  return NextResponse.json({
    profiles: allProfiles ?? [],
    participantIds: (roster ?? []).map((r) => r.profile_id),
  });
}

const BodySchema = z.object({ profileIds: z.array(z.string().uuid()) });

/** Reemplaza el roster completo de una temporada por la lista recibida. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const guard = await requireAdminUser();
  if (!guard) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { seasonId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { error: deleteError } = await guard.supabase
    .from("season_participants")
    .delete()
    .eq("season_id", seasonId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (parsed.data.profileIds.length > 0) {
    const { error: insertError } = await guard.supabase.from("season_participants").insert(
      parsed.data.profileIds.map((profileId) => ({ season_id: seasonId, profile_id: profileId }))
    );
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: parsed.data.profileIds.length });
}
