"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Input";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push(searchParams.get("next") ?? "/ladder");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Panel className="w-full max-w-md p-8">
        <h1 className="font-display text-4xl uppercase tracking-wide text-accent">
          Entrar
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Accede al ladder de SoloCumChallenge.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <FieldError>{error}</FieldError>

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 font-body text-sm text-ink-muted">
          ¿No tienes cuenta todavía?{" "}
          <Link href="/registro" className="text-accent hover:text-accent-bright">
            Regístrate con tu código de invitación
          </Link>
        </p>
      </Panel>
    </main>
  );
}
