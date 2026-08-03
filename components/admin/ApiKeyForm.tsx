"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export function ApiKeyForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; pingOk: boolean | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotApiKey: value.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No se pudo guardar la key.");
        return;
      }
      setResult({ ok: true, pingOk: body.pingOk });
      setValue("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="riotApiKey">Riot API Key vigente</Label>
        <textarea
          id="riotApiKey"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          rows={2}
          className="focus-ring w-full rounded-xl border border-obsidian-700 bg-obsidian-900 px-3.5 py-2.5 font-mono text-sm text-ink outline-none focus-visible:border-accent"
        />
        <p className="font-body text-xs text-ink-muted">
          Las Personal Keys de developer.riotgames.com expiran cada 24h — pega la nueva acá,
          sin necesidad de redeploy.
        </p>
      </div>

      <Button onClick={handleSubmit} disabled={loading || value.trim().length < 10} className="w-fit">
        {loading ? "Guardando…" : "Guardar y probar"}
      </Button>

      {result && (
        <p
          className={cn(
            "font-mono text-sm",
            result.pingOk === true && "text-win",
            result.pingOk === false && "text-loss",
            result.pingOk === null && "text-ink-muted"
          )}
        >
          {result.pingOk === true && "✓ Key guardada y verificada con Riot."}
          {result.pingOk === false && "Key guardada, pero el ping de prueba falló."}
          {result.pingOk === null &&
            "Key guardada. No se pudo probar (tu propio perfil aún no tiene Riot ID vinculado)."}
        </p>
      )}
      {error && <p className="font-body text-sm text-loss">{error}</p>}
    </div>
  );
}
