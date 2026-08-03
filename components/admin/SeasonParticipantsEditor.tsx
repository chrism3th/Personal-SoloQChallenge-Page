"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProfileChecklist } from "./ProfileChecklist";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "slug" | "display_name" | "riot_game_name" | "riot_tag_line"
>;

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profiles: ProfileRow[]; selectedIds: Set<string> };

export function SeasonParticipantsEditor({ seasonId }: { seasonId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/seasons/${seasonId}/participants`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar el roster.");
        return res.json();
      })
      .then((body: { profiles: ProfileRow[]; participantIds: string[] }) => {
        if (!cancelled) {
          setState({
            status: "ready",
            profiles: body.profiles,
            selectedIds: new Set(body.participantIds),
          });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  async function handleSave() {
    if (state.status !== "ready") return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/participants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds: Array.from(state.selectedIds) }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") {
    return <p className="font-body text-sm text-ink-muted">Cargando roster…</p>;
  }

  if (state.status === "error") {
    return <p className="font-body text-sm text-loss">{state.message}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ProfileChecklist
        profiles={state.profiles}
        selectedIds={state.selectedIds}
        onChange={(next) => setState({ ...state, selectedIds: next })}
      />
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={handleSave} disabled={saving} className="text-xs">
          {saving ? "Guardando…" : `Guardar roster (${state.selectedIds.size})`}
        </Button>
        {saved && <span className="font-mono text-xs text-win">Guardado.</span>}
      </div>
    </div>
  );
}
