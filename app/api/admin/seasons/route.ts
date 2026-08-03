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

  return profile?.is_admin ? { supabase, userId: user.id } : null;
}

const CreateSchema = z.object({
  action: z.literal("create"),
  name: z.string().min(1),
  startsAt: z.string(),
  isCurrent: z.boolean().optional(),
  profileIds: z.array(z.string().uuid()).optional(),
});

const CloseSchema = z.object({
  action: z.literal("close"),
  seasonId: z.string().uuid(),
});

export async function POST(request: Request) {
  const guard = await requireAdminUser();
  if (!guard) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const json = await request.json().catch(() => null);

  if (json?.action === "close") {
    const parsed = CloseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }
    const { error } = await guard.supabase.rpc("close_season", {
      p_season_id: parsed.data.seasonId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { data, error } = await guard.supabase
    .from("seasons")
    .insert({
      name: parsed.data.name,
      starts_at: parsed.data.startsAt,
      is_current: parsed.data.isCurrent ?? true,
      created_by: guard.userId,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.profileIds && parsed.data.profileIds.length > 0) {
    const { error: rosterError } = await guard.supabase.from("season_participants").insert(
      parsed.data.profileIds.map((profileId) => ({ season_id: data.id, profile_id: profileId }))
    );
    if (rosterError) {
      return NextResponse.json(
        { error: `Temporada creada, pero falló el roster: ${rosterError.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ season: data });
}
