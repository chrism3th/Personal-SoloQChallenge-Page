"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { ProfileChecklist } from "./ProfileChecklist";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "slug" | "display_name" | "riot_game_name" | "riot_tag_line"
>;

export function SeasonForm({ profiles }: { profiles: ProfileRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(profiles.map((p) => p.id)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: name.trim(),
          startsAt: new Date(startsAt).toISOString(),
          isCurrent: true,
          profileIds: Array.from(selectedIds),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No se pudo crear la temporada.");
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seasonName">Nombre</Label>
          <Input
            id="seasonName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="S1 · Split de Verano 2026"
            className="w-64"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startsAt">Inicio</Label>
          <Input
            id="startsAt"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
          {loading ? "Creando…" : "Crear temporada"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-obsidian-700 pt-4">
        <Label>Jugadores que participan ({selectedIds.size})</Label>
        <ProfileChecklist profiles={profiles} selectedIds={selectedIds} onChange={setSelectedIds} />
      </div>

      <p className="font-body text-xs text-ink-muted">
        La nueva temporada queda como la activa; la temporada activa anterior deja de mostrarse
        como &quot;en curso&quot; pero conserva su histórico. Solo los jugadores marcados arriba
        van a aparecer en el ladder de esta temporada — podés cambiar el roster después desde esta
        misma pantalla.
      </p>
      {error && <p className="font-body text-sm text-loss">{error}</p>}
    </div>
  );
}
