"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function InviteGenerator() {
  const router = useRouter();
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No se pudo generar el código.");
        return;
      }
      setLastCode(body.invite.code);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiresInDays">Expira en (días, 0 = nunca)</Label>
          <Input
            id="expiresInDays"
            type="number"
            min={0}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="w-32"
          />
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generando…" : "Generar invitación"}
        </Button>
      </div>

      {lastCode && (
        <p className="font-mono text-lg text-win">
          Código nuevo: <span className="tracking-[0.3em]">{lastCode}</span>
        </p>
      )}
      {error && <p className="font-body text-sm text-loss">{error}</p>}
    </div>
  );
}
