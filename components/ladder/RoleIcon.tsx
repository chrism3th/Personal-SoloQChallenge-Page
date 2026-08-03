import { Crosshair, HeartHandshake, Swords, TreePine, Zap } from "lucide-react";
import { ROLE_LABELS } from "@/lib/riot/roles";

const ROLE_ICONS: Record<string, typeof Swords> = {
  TOP: Swords,
  JUNGLE: TreePine,
  MIDDLE: Zap,
  BOTTOM: Crosshair,
  UTILITY: HeartHandshake,
};

export function RoleIcon({
  role,
  size = 14,
  showLabel = true,
}: {
  role: string | null;
  size?: number;
  showLabel?: boolean;
}) {
  if (!role) return <span className="font-mono text-xs text-ink-muted">—</span>;

  const Icon = ROLE_ICONS[role];
  const label = ROLE_LABELS[role] ?? role;

  return (
    <span className="flex items-center gap-1.5 text-ink-muted" title={label}>
      {Icon && <Icon size={size} aria-hidden />}
      {showLabel && <span className="font-body text-xs">{label}</span>}
    </span>
  );
}
