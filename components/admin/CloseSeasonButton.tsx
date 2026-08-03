"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CloseSeasonButton({ seasonId }: { seasonId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    if (!confirm("¿Cerrar esta temporada? El ranking final quedará congelado.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", seasonId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="danger" onClick={handleClose} disabled={loading} className="text-xs">
      {loading ? "Cerrando…" : "Cerrar temporada"}
    </Button>
  );
}
