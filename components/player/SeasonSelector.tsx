"use client";

import { useRouter } from "next/navigation";
import type { Database } from "@/lib/supabase/types";

type SeasonRow = Database["public"]["Tables"]["seasons"]["Row"];

export function SeasonSelector({
  seasons,
  activeSeasonId,
}: {
  seasons: SeasonRow[];
  activeSeasonId: string | null;
}) {
  const router = useRouter();

  return (
    <select
      value={activeSeasonId ?? ""}
      onChange={(e) => router.push(`?season=${e.target.value}`)}
      className="focus-ring rounded-xl border border-obsidian-700 bg-obsidian-900 px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted hover:border-accent"
    >
      {seasons.map((season) => (
        <option key={season.id} value={season.id}>
          {season.name}
        </option>
      ))}
    </select>
  );
}
