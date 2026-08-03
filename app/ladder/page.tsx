import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason, getLadder } from "@/lib/ranking/season-scope";
import { LadderTable } from "@/components/ladder/LadderTable";

export default async function LadderPage() {
  const supabase = await createClient();
  const season = await getCurrentSeason(supabase);
  const entries = await getLadder(supabase, season);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {season ? season.name : "Ladder histórico"}
        </p>
        <h1 className="font-display text-5xl uppercase tracking-wide">Ladder</h1>
      </div>
      <LadderTable entries={entries} seasonId={season?.id ?? null} />
    </main>
  );
}
