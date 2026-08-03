import { createAdminClient } from "@/lib/supabase/admin";

export async function getCronSecret(): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("cron_secret")
    .eq("id", true)
    .maybeSingle();

  return data?.cron_secret?.trim() || process.env.CRON_SECRET?.trim() || null;
}