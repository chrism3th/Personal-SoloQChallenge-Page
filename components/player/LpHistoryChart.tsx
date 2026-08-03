"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/shared/Panel";

type Point = { date: string; value: number; label: string };

export function LpHistoryChart({ data }: { data: Point[] }) {
  if (data.length < 2) {
    return (
      <Panel className="p-6">
        <p className="font-body text-sm text-ink-muted">
          Todavía no hay suficiente historial para graficar la progresión de rango.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Progresión de rango
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="lpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-obsidian-700)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" })
            }
            stroke="var(--color-ink-muted)"
            fontSize={11}
          />
          <YAxis hide domain={["dataMin - 200", "dataMax + 200"]} />
          <Tooltip
            contentStyle={{
              background: "var(--color-obsidian-900)",
              border: "1px solid var(--color-obsidian-700)",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            labelFormatter={(value) => new Date(String(value)).toLocaleString("es-CL")}
            formatter={(_value, _name, item) => [
              (item?.payload as Point | undefined)?.label ?? "",
              "Rango",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            fill="url(#lpGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-accent-bright)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}
