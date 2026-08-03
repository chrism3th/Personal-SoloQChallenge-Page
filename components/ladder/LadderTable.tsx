import { Users } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import type { LadderEntry } from "@/lib/ranking/season-scope";
import {
  championIconUrl,
  getChampionNameById,
  getLatestDdragonVersion,
} from "@/lib/riot/ddragon";
import { LadderList } from "./LadderList";
import type { LadderRowLive } from "./LadderRow";

/**
 * Envoltura de servidor del ladder: resuelve lo que necesita un fetch (la
 * versión de Data Dragon y el nombre del campeón de cada partida en curso) y
 * le pasa el resultado ya plano a la lista interactiva.
 *
 * El mapeo id -> nombre de campeón es asíncrono, así que no puede vivir dentro
 * de LadderRow, que es client component.
 */
export async function LadderTable({
  entries,
  seasonId,
}: {
  entries: LadderEntry[];
  seasonId: string | null;
}) {
  if (entries.length === 0) {
    return (
      <Panel className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <Users size={28} className="text-ink-muted" aria-hidden />
        <p className="font-display text-xl uppercase tracking-wide text-ink">Ladder vacío</p>
        <p className="max-w-sm font-body text-sm text-ink-muted">
          Todavía no hay jugadores con datos en este periodo. El ladder se llena solo en cuanto el
          cron registre la primera partida ranked.
        </p>
      </Panel>
    );
  }

  const version = await getLatestDdragonVersion();

  const liveEntries = await Promise.all(
    entries
      .filter((entry) => entry.isLive && entry.liveChampionId != null)
      .map(async (entry) => {
        const championName = await getChampionNameById(version, entry.liveChampionId);
        return [
          entry.profile.id,
          {
            championName,
            championIconUrl: championName ? championIconUrl(version, championName) : null,
          },
        ] as const;
      })
  );

  const liveByProfileId: Record<string, LadderRowLive> = Object.fromEntries(liveEntries);

  return (
    <LadderList
      entries={entries}
      version={version}
      seasonId={seasonId}
      liveByProfileId={liveByProfileId}
    />
  );
}
