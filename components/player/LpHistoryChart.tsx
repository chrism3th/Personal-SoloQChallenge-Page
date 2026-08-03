"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Image from "next/image";
import { TrendingUp } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/Badge";
import {
  formatTierDivision,
  rankLabelFromValue,
  tierBands,
  tierFromRankValue,
  tierGlowVar,
} from "@/lib/ranking/lp-math";
import { tierEmblemUrl } from "@/lib/riot/ddragon";
import type { Division, Tier } from "@/lib/supabase/types";

type Point = { date: string; value: number; label: string };

/**
 * Progresión de rango sobre bandas de tier reales.
 *
 * Se puede hacer porque rankValue() usa exactamente 10.000 unidades por tier,
 * así que los límites de cada banda caen en múltiplos redondos y las
 * `ReferenceArea` no tienen que inferir nada. Antes el eje Y estaba oculto y
 * la línea flotaba sin referencia: subir 300 LP dentro de la división y
 * ascender de tier se veían exactamente igual.
 */
export function LpHistoryChart({
  data,
  currentRank,
}: {
  data: Point[];
  /** Solo para el estado vacío, cuando todavía no hay serie que dibujar. */
  currentRank?: { tier: Tier; division: Division; leaguePoints: number } | null;
}) {
  if (data.length < 2) {
    return <EmptyChart currentRank={currentRank} />;
  }

  const values = data.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Aire arriba y abajo para que la línea no toque los bordes, sin salirse de
  // la escala de tiers (que empieza en 0).
  const padding = Math.max(300, (rawMax - rawMin) * 0.15);
  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;

  const bands = tierBands(min, max);
  const peak = data.reduce((best, point) => (point.value > best.value ? point : best), data[0]);

  // El movimiento se muestra como el cambio de rango de punta a punta
  // ("Platinum II → Diamond III"). Antes se mostraba la resta cruda de
  // rankValue ("+19073"), que es un número interno de la escala de
  // ordenamiento y no significa nada para quien lo lee — encima no es lineal
  // entre tiers, así que tampoco se puede leer como "divisiones".
  const first = data[0];
  const last = data[data.length - 1];
  const netDelta = last.value - first.value;
  const rankChange =
    netDelta === 0
      ? "Sin cambios"
      : `${rankLabelFromValue(first.value)} → ${rankLabelFromValue(last.value)}`;

  return (
    <Panel className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
          Progresión de rango
        </p>
        <div className="flex items-center gap-2">
          <Badge tone={netDelta > 0 ? "win" : netDelta < 0 ? "loss" : "neutral"} size="sm">
            {netDelta !== 0 && (
              <TrendingUp size={10} className={netDelta > 0 ? "" : "rotate-180"} aria-hidden />
            )}
            {rankChange}
          </Badge>
          <span className="font-mono text-[11px] text-ink-muted tabular">
            {data.length} registros
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Bandas de tier de fondo, cada una en el color real de su rango. */}
          {bands.map((band) => (
            <ReferenceArea
              key={band.tier}
              y1={band.y1}
              y2={band.y2}
              fill={band.color}
              fillOpacity={0.08}
              stroke={band.color}
              strokeOpacity={0.18}
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

          {/* El eje Y estaba en `hide`; ahora rotula cada banda con su tier,
              que es la unidad en la que la gente piensa su progreso. */}
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
            isAnimationActive
            animationDuration={900}
          />

          {/* Marcador del pico: el dato que la gente busca primero. */}
          <ReferenceDot
            x={peak.date}
            y={peak.value}
            r={4}
            fill="var(--color-tier-challenger)"
            stroke="var(--color-obsidian-950)"
            strokeWidth={2}
            ifOverflow="visible"
            label={{
              value: `Pico · ${rankLabelFromValue(peak.value)}`,
              // Si el pico cae en la última fecha (lo habitual cuando alguien
              // viene subiendo), una etiqueta centrada se corta contra el
              // borde derecho: en ese caso se ancla a la izquierda del punto.
              position: peak === last ? "insideTopRight" : "top",
              fill: "var(--color-tier-challenger)",
              fontSize: 10,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/**
 * Estado vacío con forma propia. Con menos de dos snapshots no hay progresión
 * que dibujar — el caso de cualquier jugador recién incorporado — así que en
 * vez de un párrafo gris se muestra el rango actual sobre su propia banda de
 * tier y se explica qué falta para que aparezca la curva.
 */
function EmptyChart({
  currentRank,
}: {
  currentRank?: { tier: Tier; division: Division; leaguePoints: number } | null;
}) {
  const glow = currentRank ? tierGlowVar(currentRank.tier) : "var(--color-accent)";

  return (
    <Panel glowColor={glow} className="overflow-hidden p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Progresión de rango
      </p>

      <div
        className="flex flex-col items-center gap-3 rounded-card py-10"
        style={{
          background: `linear-gradient(to top, color-mix(in oklab, ${glow} 14%, transparent), transparent)`,
        }}
      >
        {currentRank ? (
          <>
            <Image src={tierEmblemUrl(currentRank.tier)} alt="" width={56} height={56} unoptimized />
            <span className="font-display text-2xl uppercase tracking-wide" style={{ color: glow }}>
              {formatTierDivision(currentRank.tier, currentRank.division)}
            </span>
            <span className="font-mono text-sm text-ink-muted tabular">
              {currentRank.leaguePoints} LP
            </span>
          </>
        ) : (
          <span className="font-display text-2xl uppercase tracking-wide text-ink-muted">
            Sin rango
          </span>
        )}

        <p className="max-w-xs text-center font-body text-sm text-ink-muted">
          Hace falta al menos un registro más de LP para dibujar la curva. El cron toma uno cada vez
          que revisa las partidas.
        </p>
      </div>
    </Panel>
  );
}
