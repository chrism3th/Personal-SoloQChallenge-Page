import { createClient } from "@/lib/supabase/server";
import { Panel } from "@/components/shared/Panel";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: settings }, { count: activeCount }, { data: currentSeason }] = await Promise.all([
    supabase
      .from("app_settings")
      .select("riot_api_key_status, riot_api_key_updated_at")
      .eq("id", true)
      .single(),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("seasons").select("name, starts_at").eq("is_current", true).maybeSingle(),
  ]);

  const status = settings?.riot_api_key_status ?? "unknown";

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Panel className="p-6">
        <p className="font-body text-xs uppercase tracking-widest text-ink-muted">
          Riot API key
        </p>
        <p
          className={cn(
            "mt-2 font-display text-3xl uppercase",
            status === "valid" && "text-win",
            status === "invalid" && "text-loss",
            status === "unknown" && "text-ink-muted"
          )}
        >
          {status === "valid" ? "Válida" : status === "invalid" ? "Inválida" : "Sin probar"}
        </p>
        {settings?.riot_api_key_updated_at && (
          <p className="mt-1 font-mono text-xs text-ink-muted">
            actualizada {formatRelativeTime(settings.riot_api_key_updated_at)}
          </p>
        )}
      </Panel>

      <Panel className="p-6">
        <p className="font-body text-xs uppercase tracking-widest text-ink-muted">
          Jugadores activos
        </p>
        <p className="mt-2 font-display text-3xl text-accent">{activeCount ?? 0}</p>
      </Panel>

      <Panel className="p-6">
        <p className="font-body text-xs uppercase tracking-widest text-ink-muted">
          Temporada activa
        </p>
        <p className="mt-2 font-display text-2xl uppercase text-accent">
          {currentSeason?.name ?? "Sin temporada"}
        </p>
      </Panel>
    </div>
  );
}
