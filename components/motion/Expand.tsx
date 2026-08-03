"use client";

import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";
import { DURATION, EASE_OUT } from "@/lib/motion/tokens";

/**
 * Despliegue vertical con altura animada. Reemplaza el `{open && <div/>}` seco
 * de la fila expandible del ladder, que aparecía y desaparecía de golpe.
 *
 * `overflow-hidden` es imprescindible: sin él el contenido se ve desbordando
 * el contenedor mientras la altura todavía está creciendo.
 */
export function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <m.div
          key="content"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: DURATION.base, ease: EASE_OUT }}
          className="overflow-hidden"
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
