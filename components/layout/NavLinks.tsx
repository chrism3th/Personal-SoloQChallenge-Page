"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { SPRING } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

export type NavItem = { href: string; label: string };

/**
 * Navegación con la ruta activa marcada. El realce viaja entre elementos con
 * `layoutId` en vez de aparecer de golpe.
 *
 * Es client component solo por `usePathname`: el Header sigue siendo de
 * servidor y le pasa la lista de enlaces ya resuelta según la sesión.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        // `startsWith` para que /jugador/alguien también marque "Mi perfil",
        // pero sin que "/" marque todo.
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring relative rounded-full px-3 py-1 transition-colors sm:px-2.5",
              active ? "text-ink" : "text-ink-muted hover:text-ink"
            )}
          >
            {active && (
              <m.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-full bg-accent/15 ring-1 ring-accent/30"
                transition={SPRING}
              />
            )}
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
