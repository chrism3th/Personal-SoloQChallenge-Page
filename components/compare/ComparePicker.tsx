"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type PickerProfile = { id: string; name: string; slug: string };

/**
 * Selector de jugadores del comparador. Mantiene la selección en la query
 * string (`?p=id&p=id`) para que una comparación se pueda compartir por link
 * y sobreviva a recargar la página.
 */
export function ComparePicker({
  profiles,
  selected,
}: {
  profiles: PickerProfile[];
  selected: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggle(profileId: string) {
    const next = selected.includes(profileId)
      ? selected.filter((id) => id !== profileId)
      : [...selected, profileId];

    const params = new URLSearchParams(searchParams.toString());
    params.delete("p");
    for (const id of next) params.append("p", id);
    router.push(`/comparar?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {profiles.map((profile) => {
        const isSelected = selected.includes(profile.id);
        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => toggle(profile.id)}
            aria-pressed={isSelected}
            className={cn(
              "focus-ring inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5",
              "font-body text-sm transition-colors",
              isSelected
                ? "border-accent/50 bg-accent/15 text-ink"
                : "border-obsidian-700 bg-obsidian-900 text-ink-muted hover:border-accent hover:text-ink"
            )}
          >
            {isSelected && <Check size={12} aria-hidden />}
            {profile.name}
          </button>
        );
      })}
    </div>
  );
}
