import { Panel } from "@/components/shared/Panel";
import { RoleIcon } from "@/components/ladder/RoleIcon";
import { Bar } from "@/components/ui/Bar";
import { ROLE_LABELS } from "@/lib/riot/roles";
import { winrate } from "@/lib/ranking/lp-math";

type RoleStat = { role: string; games: number; wins: number };

/**
 * Distribución de roles con su winrate.
 *
 * Antes la barra codificaba *volumen* (partidas respecto del rol más jugado)
 * pero se pintaba del color de acento, así que parecía un medidor de winrate
 * y no lo era: el winrate quedaba solo en el texto de la derecha. Ahora la
 * barra es victorias/derrotas apiladas — lee lo que aparenta leer — y el
 * volumen se comunica con el ancho del contenedor.
 */
export function RoleWinrateBars({ stats }: { stats: RoleStat[] }) {
  if (stats.length === 0) {
    return (
      <Panel className="p-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-muted">
          Distribución de roles
        </p>
        <p className="font-body text-sm text-ink-muted">
          Todavía no hay partidas con rol identificado.
        </p>
      </Panel>
    );
  }

  const maxGames = Math.max(...stats.map((s) => s.games));

  return (
    <Panel className="p-6">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-ink-muted">
        Distribución de roles
      </p>
      <div className="flex flex-col gap-3">
        {stats.map((stat) => {
          const wr = winrate(stat.wins, stat.games - stat.wins);
          return (
            <div key={stat.role} className="flex items-center gap-3">
              <span className="flex w-24 shrink-0 items-center gap-1.5">
                <RoleIcon role={stat.role} showLabel={false} />
                <span className="truncate font-body text-sm text-ink-muted">
                  {ROLE_LABELS[stat.role] ?? stat.role}
                </span>
              </span>

              {/* El ancho del contenedor codifica el volumen relativo; los
                  segmentos de dentro, el resultado. */}
              <div className="flex flex-1 justify-start">
                <div style={{ width: `${Math.max(12, (stat.games / maxGames) * 100)}%` }}>
                  <Bar
                    segments={[
                      { value: stat.wins, color: "var(--color-win)" },
                      { value: stat.games - stat.wins, color: "var(--color-loss)" },
                    ]}
                    ariaLabel={`${ROLE_LABELS[stat.role] ?? stat.role}: ${stat.wins} victorias de ${stat.games} partidas`}
                  />
                </div>
              </div>

              <span className="w-24 shrink-0 text-right font-mono text-xs text-ink-muted tabular">
                {stat.games}j · {wr}%
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
