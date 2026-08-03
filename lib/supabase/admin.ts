import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente Supabase con la service_role key: bypassa RLS por completo.
 * Solo debe usarse desde código server-only de confianza: rutas de cron
 * (poll-matches, poll-live-status) y rutas admin que escriben en
 * app_settings/invites en nombre del owner. Nunca importar desde un
 * Client Component ni exponer esta key al navegador.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
