"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Eye, Sprout } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { RoleIcon } from "@/components/ladder/RoleIcon";
import type { PanelMatchRow } from "@/lib/ranking/panel";
import { ROLE_LABELS } from "@/lib/riot/roles";
import { formatGameDuration, formatRelativeTime, formatSigned } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type ResultFilter = "all" | "wins" | "losses";

export function MatchHistoryList({
  matches,
  onSelectMatch,
}: {
  matches: PanelMatchRow[];
  onSelectMatch: (matchId: string) => void;
}) {
  const [champion, setChampion] = useState("all");
  const [role, setRole] = useState("all");
  const [result, setResult] = useState<ResultFilter>("all");

  const champions = useMemo(
    () => Array.from(new Set(matches.map((m) => m.championName))).sort(),
    [matches]
  );
  const roles = useMemo(
    () => Array.from(new Set(matches.map((m) => m.role).filter((r): r is string => r != null))),
    [matches]
  );

  const visible = useMemo(
    () =>
      matches.filter((match) => {
        if (champion !== "all" && match.championName !== champion) return false;
        if (role !== "all" && match.role !== role) return false;
        if (result === "wins" && !match.win) return false;
        if (result === "losses" && match.win) return false;
        return true;
      }),
    [matches, champion, role, result]
  );

  if (matches.length === 0) {
    return (
      <div className="panel p-6">
        <p className="mb-2 font-body text-xs uppercase tracking-widest text-ink-muted">
          Historial de partidas
        </p>
        <p className="font-body text-sm text-ink-muted">Todavía no hay partidas registradas.</p>
      </div>
    );
  }

  const visibleWins = visible.filter((m) => m.win).length;

  return (
    <div className="panel p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="font-body text-xs uppercase tracking-widest text-ink-muted">
          Historial de partidas
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {champions.length > 1 && (
            <Select
              value={champion}
              onChange={(e) => setChampion(e.target.value)}
              aria-label="Filtrar por campeón"
            >
              <option value="all">Todos los campeones</option>
              {champions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          )}

          {roles.length > 1 && (
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Filtrar por rol"
            >
              <option value="all">Todos los roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </Select>
          )}

          <Select
            value={result}
            onChange={(e) => setResult(e.target.value as ResultFilter)}
            aria-label="Filtrar por resultado"
          >
            <option value="all">Todos</option>
            <option value="wins">Victorias</option>
            <option value="losses">Derrotas</option>
          </Select>
        </div>
      </div>

      <p className="mb-3 font-mono text-[11px] text-ink-muted tabular">
        {visible.length} partidas · {visibleWins}V {visible.length - visibleWins}D
      </p>

      {visible.length === 0 ? (
        <p className="py-6 text-center font-body text-sm text-ink-muted">
          Ninguna partida coincide con los filtros.
        </p>
      ) : (
        <Stagger as="ol" className="flex flex-col gap-2">
          {visible.map((match, index) => (
            <StaggerItem as="li" key={match.matchId || index}>
              <MatchRow match={match} onSelect={onSelectMatch} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function MatchRow({
  match,
  onSelect,
}: {
  match: PanelMatchRow;
  onSelect: (matchId: string) => void;
}) {
  const kda =
    match.deaths === 0 ? match.kills + match.assists : (match.kills + match.assists) / match.deaths;

  return (
    <button
      type="button"
      onClick={() => match.matchId && onSelect(match.matchId)}
      disabled={!match.matchId}
      style={
        {
          "--glow-color": match.win ? "var(--color-win)" : "var(--color-loss)",
        } as React.CSSProperties
      }
      className={cn(
        "tier-rail focus-ring flex w-full flex-wrap items-center gap-3 rounded-card border py-3 pl-4 pr-3.5 text-left transition-colors sm:flex-nowrap",
        match.win
          ? "border-win/25 bg-win/5 hover:bg-win/10"
          : "border-loss/25 bg-loss/5 hover:bg-loss/10",
        !match.matchId && "cursor-default hover:bg-transparent"
      )}
    >
      {/* resultado + tiempo */}
      <div className="w-20 shrink-0">
        <p className={cn("font-body text-sm font-bold", match.win ? "text-win" : "text-loss")}>
          {match.win ? "Victoria" : "Derrota"}
        </p>
        {match.gameCreation && (
          <p className="font-mono text-[11px] text-ink-muted">
            {formatRelativeTime(match.gameCreation)} · {formatGameDuration(match.gameDuration)}
          </p>
        )}
      </div>

      {/* campeón + hechizos + runas */}
      <div className="flex shrink-0 items-center gap-1">
        <Image
          src={match.championIconUrl}
          alt={match.championName}
          width={40}
          height={40}
          unoptimized
          className="rounded-lg"
        />
        <div className="grid grid-cols-2 gap-0.5">
          {[match.spell1IconUrl, match.spell2IconUrl].map((src, i) =>
            src ? (
              <Image key={i} src={src} alt="" width={18} height={18} unoptimized className="rounded-sm" />
            ) : (
              <div key={i} className="h-[18px] w-[18px] rounded-sm bg-obsidian-800" />
            )
          )}
          {[match.keystoneIconUrl, match.subTreeIconUrl].map((src, i) =>
            src ? (
              <Image
                key={i}
                src={src}
                alt=""
                width={18}
                height={18}
                unoptimized
                className="rounded-full bg-obsidian-950"
              />
            ) : (
              <div key={i} className="h-[18px] w-[18px] rounded-full bg-obsidian-800" />
            )
          )}
        </div>
      </div>

      {/* rol + rival de línea */}
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <RoleIcon role={match.role} showLabel={false} />
        {match.opponentChampionIconUrl && (
          <>
            <span className="font-mono text-[11px] text-ink-muted">vs</span>
            <Image
              src={match.opponentChampionIconUrl}
              alt={match.opponentChampionName ?? ""}
              width={24}
              height={24}
              unoptimized
              className="rounded-lg opacity-70"
            />
          </>
        )}
      </div>

      {/* KDA + farmeo + visión */}
      <div className="min-w-[9rem] shrink-0">
        <p className="font-mono text-sm font-semibold tabular">
          {match.kills}/{match.deaths}/{match.assists}
          <span className="ml-1.5 text-[11px] font-normal text-ink-muted">
            {kda.toFixed(1)} KDA
          </span>
        </p>
        <p className="flex items-center gap-2 font-mono text-[11px] text-ink-muted tabular">
          <span className="flex items-center gap-0.5" title="CS por minuto">
            <Sprout size={10} className="text-cyan" aria-hidden />
            {match.csPerMin.toFixed(1)}
          </span>
          {match.visionScore != null && (
            <span className="flex items-center gap-0.5" title="Puntuación de visión">
              <Eye size={10} className="text-cyan" aria-hidden />
              {match.visionScore}
            </span>
          )}
          {match.killParticipation != null && (
            <span title="Participación en asesinatos">
              {Math.round(match.killParticipation * 100)}% KP
            </span>
          )}
        </p>
      </div>

      {/* items */}
      <div className="hidden shrink-0 gap-0.5 sm:flex">
        {match.itemIconUrls.map((src, i) =>
          src ? (
            <Image key={i} src={src} alt="" width={22} height={22} unoptimized className="rounded-sm" />
          ) : (
            <div key={i} className="h-[22px] w-[22px] rounded-sm bg-obsidian-800" />
          )
        )}
      </div>

      {/* LP */}
      <div className="ml-auto shrink-0 text-right">
        {match.lpDelta != null ? (
          <p
            className={cn(
              "font-mono text-sm font-semibold tabular",
              match.lpDelta >= 0 ? "text-win" : "text-loss"
            )}
          >
            {formatSigned(match.lpDelta, " LP")}
          </p>
        ) : (
          <p className="font-mono text-sm text-ink-muted">— LP</p>
        )}
      </div>
    </button>
  );
}
