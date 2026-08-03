"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/shared/Panel";
import { tierBands, tierFromRankValue } from "@/lib/ranking/lp-math";
import type { ComparisonChartPoint } from "@/lib/ranking/compare";

/** Una serie por jugador, en colores distinguibles sobre el fondo oscuro. */
const SERIES_COLORS = [
  "var(--color-accent-bright)",
  "var(--color-cyan)",
  "var(--color-tier-gold)",
  "var(--color-win)",
];

export function CompareChart({
  data,
  players,
}: {
  data: ComparisonChartPoint[];
  players: { slug: string; name: string }[];
}) {
  if (data.length < 2) {
    return (
      <Panel className="px-6 py-10 text-center">
        <p className="font-display text-lg uppercase tracking-wide text-ink">
          Sin progresión que comparar
        </p>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Hace falta al menos un par de registros de LP entre los jugadores elegidos.
        </p>
      </Panel>
    );
  }

  const values = data.flatMap((point) =>
    players.map((player) => point[player.slug]).filter((v): v is number => typeof v === "number")
  );
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max(300, (rawMax - rawMin) * 0.15);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const bands = tierBands(min, max);

  return (
    <Panel className="p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Progresión comparada
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          {bands.map((band) => (
            <ReferenceArea
              key={band.tier}
              y1={band.y1}
              y2={band.y2}
              fill={band.color}
              fillOpacity={0.07}
              stroke={band.color}
              strokeOpacity={0.15}
              strokeDasharray="3 3"
              ifOverflow="hidden"
            />
          ))}

          <CartesianGrid stroke="var(--color-obsidian-700)" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" })
            }
            stroke="var(--color-ink-muted)"
            fontSize={11}
          />

          <YAxis
            domain={[min, max]}
            ticks={bands.map((band) => band.y1)}
            tickFormatter={(value: number) => {
              const tier = tierFromRankValue(value);
              return tier.charAt(0) + tier.slice(1).toLowerCase();
            }}
            stroke="var(--color-ink-muted)"
            fontSize={10}
            width={68}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              background: "var(--color-obsidian-900)",
              border: "1px solid var(--color-obsidian-700)",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            labelFormatter={(value) => new Date(String(value)).toLocaleDateString("es-CL")}
          />

          {players.map((player, index) => (
            <Line
              key={player.slug}
              type="monotone"
              dataKey={player.slug}
              name={player.name}
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              // Sin esto, cada hueco de la serie parte la línea en trozos.
              connectNulls
              activeDot={{ r: 4 }}
              animationDuration={900}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 flex flex-wrap gap-4">
        {players.map((player, index) => (
          <span key={player.slug} className="flex items-center gap-1.5 font-mono text-[11px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: SERIES_COLORS[index % SERIES_COLORS.length] }}
              aria-hidden
            />
            {player.name}
          </span>
        ))}
      </div>
    </Panel>
  );
}
