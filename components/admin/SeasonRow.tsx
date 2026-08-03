"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { CloseSeasonButton } from "./CloseSeasonButton";
import { SeasonParticipantsEditor } from "./SeasonParticipantsEditor";
import { formatDateRange } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/lib/supabase/types";

type SeasonRowType = Database["public"]["Tables"]["seasons"]["Row"];

export function SeasonRow({ season }: { season: SeasonRowType }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Panel className="flex flex-col gap-4 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl uppercase tracking-wide">
            {season.name}
            {season.is_current && (
              <span className="ml-3 align-middle font-body text-xs uppercase tracking-widest text-win">
                en curso
              </span>
            )}
          </p>
          <p className="font-mono text-xs text-ink-muted">
            {formatDateRange(season.starts_at, season.ends_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!season.is_closed && <CloseSeasonButton seasonId={season.id} />}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
            aria-expanded={expanded}
          >
            Roster
            <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-obsidian-700 pt-4">
          <SeasonParticipantsEditor seasonId={season.id} />
        </div>
      )}
    </Panel>
  );
}
