import { createClient } from "@/lib/supabase/server";
import { getPublicPodium } from "@/lib/ranking/public-summary";
import { PodiumHero } from "@/components/ladder/PodiumHero";
import { LinkButton } from "@/components/ui/Button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El podio de la portada es un resumen público (ver getPublicPodium):
  // no depende de sesión. El resto del sitio (ladder completo, perfiles,
  // temporadas) sigue protegido por login.
  const { seasonName, entries } = await getPublicPodium();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          LAS · {seasonName ?? "Ladder interno"}
        </p>
        <h1 className="font-display text-7xl uppercase tracking-wide sm:text-8xl">
          SoloCumChallenge
        </h1>
        <p className="max-w-md font-body text-lg text-ink-muted">
          El ranking interno de la barra. Rango, racha y estadísticas de cada partida, en vivo.
        </p>
      </div>

      <PodiumHero entries={entries} />

      <div className="flex gap-3">
        {user ? (
          <LinkButton href="/ladder">Ver ladder completo</LinkButton>
        ) : (
          <>
            <LinkButton href="/login">Entrar</LinkButton>
            <LinkButton href="/registro" variant="secondary">
              Unirme con invitación
            </LinkButton>
          </>
        )}
      </div>
    </main>
  );
}
