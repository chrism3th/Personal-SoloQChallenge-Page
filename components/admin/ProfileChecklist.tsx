"use client";

type ProfileOption = {
  id: string;
  slug: string;
  display_name: string | null;
  riot_game_name: string;
  riot_tag_line: string;
};

export function ProfileChecklist({
  profiles,
  selectedIds,
  onChange,
}: {
  profiles: ProfileOption[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(new Set(profiles.map((p) => p.id)))}
          className="focus-ring font-mono text-[11px] uppercase tracking-widest text-accent hover:text-accent-bright"
        >
          Seleccionar todos
        </button>
        <button
          type="button"
          onClick={() => onChange(new Set())}
          className="focus-ring font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
        >
          Ninguno
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {profiles.map((p) => (
          <label
            key={p.id}
            className="focus-within:ring-accent-bright flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-obsidian-800/60 focus-within:ring-1"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(p.id)}
              onChange={() => toggle(p.id)}
              className="accent-accent"
            />
            <span className="truncate font-body text-sm">
              {p.display_name ?? p.riot_game_name}
              <span className="ml-1 font-mono text-[11px] text-ink-muted">#{p.riot_tag_line}</span>
            </span>
          </label>
        ))}
        {profiles.length === 0 && (
          <p className="col-span-full font-body text-sm text-ink-muted">
            No hay jugadores activos todavía.
          </p>
        )}
      </div>
    </div>
  );
}
