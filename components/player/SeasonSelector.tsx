"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatDateRange } from "@/lib/utils/format";
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
  const active = seasons.find((season) => season.id === activeSeasonId) ?? null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active && (
        <>
          <span className="font-mono text-[11px] text-ink-muted">
            {formatDateRange(active.starts_at, active.ends_at)}
          </span>
          <Badge tone={active.is_closed ? "neutral" : "win"} size="sm">
            {active.is_closed ? "Cerrada" : "En curso"}
          </Badge>
        </>
      )}

      <Select
        value={activeSeasonId ?? ""}
        onChange={(e) => router.push(`?season=${e.target.value}`)}
        aria-label="Cambiar de temporada"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
