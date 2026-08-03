import { createClient } from "@/lib/supabase/server";
import { SeasonForm } from "@/components/admin/SeasonForm";
import { SeasonRow } from "@/components/admin/SeasonRow";

export default async function AdminTemporadasPage() {
  const supabase = await createClient();
  const [{ data: seasons }, { data: profiles }] = await Promise.all([
    supabase.from("seasons").select("*").order("starts_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, slug, display_name, riot_game_name, riot_tag_line")
      .eq("is_active", true)
      .order("riot_game_name", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <SeasonForm profiles={profiles ?? []} />

      <div className="flex flex-col gap-3">
        {(seasons ?? []).map((season) => (
          <SeasonRow key={season.id} season={season} />
        ))}
        {(seasons ?? []).length === 0 && (
          <p className="font-body text-sm text-ink-muted">Todavía no hay temporadas creadas.</p>
        )}
      </div>
    </div>
  );
}
