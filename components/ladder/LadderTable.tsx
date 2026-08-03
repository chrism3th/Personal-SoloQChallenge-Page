import type { LadderEntry } from "@/lib/ranking/season-scope";
import { getLatestDdragonVersion } from "@/lib/riot/ddragon";
import { LadderHeader } from "./LadderHeader";
import { LadderRow } from "./LadderRow";

export async function LadderTable({
  entries,
  seasonId,
}: {
  entries: LadderEntry[];
  seasonId: string | null;
}) {
  if (entries.length === 0) {
    return (
      <p className="font-body text-ink-muted">
        Todavía no hay jugadores con datos en este periodo.
      </p>
    );
  }

  const version = await getLatestDdragonVersion();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit">
        <LadderHeader />
        <ol className="flex flex-col gap-2">
          {entries.map((entry, index) => (
            <LadderRow
              key={entry.profile.id}
              entry={entry}
              rank={index + 1}
              version={version}
              seasonId={seasonId}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
