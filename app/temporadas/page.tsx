import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listSeasons } from "@/lib/ranking/season-scope";
import { formatDateRange } from "@/lib/utils/format";
import { Panel } from "@/components/shared/Panel";

export default async function TemporadasPage() {
  const supabase = await createClient();
  const seasons = await listSeasons(supabase);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="font-display text-5xl uppercase tracking-wide">Temporadas</h1>

      <div className="flex flex-col gap-3">
        {seasons.map((season) => (
          <Link key={season.id} href={`/temporadas/${season.id}`} className="focus-ring block">
            <Panel
             
              className="flex items-center justify-between px-6 py-4 transition-colors hover:border-accent"
            >
              <div>
                <p className="font-display text-2xl uppercase tracking-wide">
                  {season.name}
                  {season.is_current && (
                    <span className="ml-3 font-body text-xs uppercase tracking-widest text-win">
                      en curso
                    </span>
                  )}
                </p>
                <p className="font-mono text-xs text-ink-muted">
                  {formatDateRange(season.starts_at, season.ends_at)}
                </p>
              </div>
            </Panel>
          </Link>
        ))}
        {seasons.length === 0 && (
          <p className="font-body text-ink-muted">Todavía no hay temporadas.</p>
        )}
      </div>
    </main>
  );
}
