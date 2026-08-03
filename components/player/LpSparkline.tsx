"use client";

import { m } from "motion/react";
import { useId } from "react";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

/**
 * Micro-gráfico de la tendencia reciente de LP: relleno degradado, punto
 * final y color según la dirección del tramo. El trazo se dibuja de izquierda
 * a derecha con `pathLength`.
 *
 * `useId` para el gradiente: puede haber varias sparklines montadas a la vez
 * (el ladder con varios paneles abiertos) y un id fijo haría que todas
 * compartieran el mismo `<defs>`.
 */
export function LpSparkline({
  values,
  width = 96,
  height = 28,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const gradientId = useId();
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 3;

  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const points = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const last = coords[coords.length - 1];

  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? "var(--color-win)" : "var(--color-loss)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Tendencia de LP: ${rising ? "al alza" : "a la baja"}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>

      <polygon points={areaPoints} fill={`url(#${gradientId})`} />

      <m.polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: DURATION.slow * 2, ease: EASE_OUT }}
      />

      <m.circle
        cx={last.x}
        cy={last.y}
        r={2.5}
        fill={stroke}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.base, delay: DURATION.slow * 2, ease: EASE_OUT }}
        style={{ transformOrigin: `${last.x}px ${last.y}px` }}
      />
    </svg>
  );
}
