import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pollProfileLiveStatus } from "@/lib/riot/poll";

export const maxDuration = 30;

function isAuthorized(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

/** Cron cada ~3 min: una llamada Spectator por perfil, barata, para que el indicador "en vivo" se sienta fresco. */
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

  let errors = 0;
  for (const profile of profiles ?? []) {
    try {
      await pollProfileLiveStatus(supabase, profile);
    } catch (err) {
      errors++;
      console.error("poll-live-status error", profile.id, err);
    }
  }

  return NextResponse.json({ processed: profiles?.length ?? 0, errors });
}
