import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/auth/invites";

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

export async function GET() {
  const guard = await requireAdminUser();
  if (!guard) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data } = await guard.supabase
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ invites: data ?? [] });
}

export async function POST(request: Request) {
  const guard = await requireAdminUser();
  if (!guard) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : 7;

  const { data, error } = await guard.supabase
    .from("invites")
    .insert({
      code: generateInviteCode(),
      created_by: guard.userId,
      expires_at:
        expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 86_400_000).toISOString() : null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invite: data });
}
