"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Input";

type RiotCheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "found"; gameName: string; tagLine: string }
  | { status: "error"; message: string };

export default function RegistroPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");

  const [riotCheck, setRiotCheck] = useState<RiotCheckState>({ status: "idle" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reset/estado "checking" en respuesta directa a que el usuario tipeó
    // un Riot ID nuevo (debounce de validación contra la Riot API) — patrón
    // estándar de fetch-on-input-change, no un derivado calculable en render.
    if (!gameName.trim() || !tagLine.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRiotCheck({ status: "idle" });
      return;
    }

    setRiotCheck({ status: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/riot/resolve-riot-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameName, tagLine }),
        });
        const body = await res.json();
        if (!res.ok) {
          setRiotCheck({ status: "error", message: body.error ?? "No se pudo verificar." });
          return;
        }
        setRiotCheck({ status: "found", gameName: body.gameName, tagLine: body.tagLine });
      } catch {
        setRiotCheck({ status: "error", message: "No se pudo verificar el Riot ID." });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [gameName, tagLine]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (riotCheck.status !== "found") {
      setFormError("Verifica tu Riot ID antes de continuar.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, inviteCode, gameName, tagLine }),
      });
      const body = await res.json();

      if (!res.ok) {
        setFormError(body.error ?? "No se pudo completar el registro.");
        setSubmitting(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });

      router.push(`/jugador/${body.slug}`);
      router.refresh();
    } catch {
      setFormError("No se pudo completar el registro. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Panel className="w-full max-w-md p-8">
        <h1 className="font-display text-4xl uppercase tracking-wide text-accent">
          Unirse a la Arena
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Necesitas un código de invitación de un miembro del grupo.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inviteCode">Código de invitación</Label>
            <Input
              id="inviteCode"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="XXXXXXXX"
              className="tracking-[0.3em] uppercase"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gameName">Riot ID</Label>
              <Input
                id="gameName"
                required
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Pepito"
              />
            </div>
            <span className="pb-2.5 font-mono text-lg text-ink-muted">#</span>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tagLine">Tag</Label>
              <Input
                id="tagLine"
                required
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="LAS1"
              />
            </div>
          </div>

          <RiotCheckStatus state={riotCheck} />

          <FieldError>{formError}</FieldError>

          <Button type="submit" disabled={submitting || riotCheck.status !== "found"} className="mt-2">
            {submitting ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 font-body text-sm text-ink-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent hover:text-accent-bright">
            Entrar
          </Link>
        </p>
      </Panel>
    </main>
  );
}

function RiotCheckStatus({ state }: { state: RiotCheckState }) {
  if (state.status === "idle") return null;
  if (state.status === "checking") {
    return <p className="font-mono text-sm text-ink-muted">Verificando Riot ID…</p>;
  }
  if (state.status === "error") {
    return <p className="font-mono text-sm text-loss">{state.message}</p>;
  }
  return (
    <p className="font-mono text-sm text-win">
      ✓ Encontrado: {state.gameName}#{state.tagLine}
    </p>
  );
}
