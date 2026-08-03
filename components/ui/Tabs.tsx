"use client";

import { m } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { SPRING } from "@/lib/motion/tokens";

export type TabItem<T extends string> = { id: T; label: string; count?: number };

/**
 * Pestañas con indicador deslizante. Extraído de PlayerPanel, donde estaba
 * inline; el subrayado ahora viaja entre pestañas con `layoutId` en vez de
 * saltar de una a otra.
 *
 * `layoutId` necesita que el id sea único por instancia montada: dos paneles
 * abiertos a la vez en el ladder compartirían el indicador si no se
 * parametriza, de ahí el prop `layoutIdSuffix`.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  layoutIdSuffix,
  className,
}: {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  layoutIdSuffix: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-6 border-b border-obsidian-700", className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "focus-ring relative -mb-px pb-2 font-mono text-xs uppercase tracking-widest transition-colors",
              selected ? "text-accent" : "text-ink-muted hover:text-ink"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 tabular text-ink-muted">{tab.count}</span>
            )}
            {selected && (
              <m.span
                layoutId={`tab-indicator-${layoutIdSuffix}`}
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent"
                transition={SPRING}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
