import { Crosshair, HeartHandshake, Swords, TreePine, Zap } from "lucide-react";
import { ROLE_LABELS } from "@/lib/riot/roles";
import { cn } from "@/lib/utils/cn";

const ROLE_ICONS: Record<string, typeof Swords> = {
  TOP: Swords,
  JUNGLE: TreePine,
  MIDDLE: Zap,
  BOTTOM: Crosshair,
  UTILITY: HeartHandshake,
};

/**
 * Un color por rol. Antes todos se pintaban del mismo gris, así que el ícono
 * no aportaba nada que no dijera ya la etiqueta de al lado; con color la
 * columna de rol se lee de un vistazo incluso con el texto oculto.
 */
const ROLE_COLORS: Record<string, string> = {
  TOP: "text-tier-bronze",
  JUNGLE: "text-tier-emerald",
  MIDDLE: "text-accent-bright",
  BOTTOM: "text-tier-grandmaster",
  UTILITY: "text-cyan",
};

export function RoleIcon({
  role,
  size = 14,
  showLabel = true,
  className,
}: {
  role: string | null;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  if (!role) return <span className="font-mono text-xs text-ink-muted">—</span>;

  const Icon = ROLE_ICONS[role];
  const label = ROLE_LABELS[role] ?? role;

  return (
    <span className={cn("flex items-center gap-1.5", className)} title={label}>
      {Icon && <Icon size={size} className={ROLE_COLORS[role] ?? "text-ink-muted"} aria-hidden />}
      {showLabel && <span className="font-body text-xs text-ink-muted">{label}</span>}
    </span>
  );
}
