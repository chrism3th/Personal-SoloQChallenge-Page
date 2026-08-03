import { createClient } from "@/lib/supabase/server";
import { getCurrentSeason, getLadder } from "@/lib/ranking/season-scope";
import { PodiumHero } from "@/components/ladder/PodiumHero";
import { LinkButton } from "@/components/ui/Button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El ladder es privado: solo se consulta (y se puede leer, por RLS) si
  // hay una sesión activa. Para visitantes anónimos no tiene sentido
  // intentar el fetch — RLS lo bloquearía igual.
  const season = user ? await getCurrentSeason(supabase) : null;
  const entries = user && season !== undefined ? await getLadder(supabase, season) : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          LAS · {season ? season.name : "Ladder interno"}
        </p>
        <h1 className="font-display text-7xl uppercase tracking-wide sm:text-8xl">
          SoloQ Arena
        </h1>
        <p className="max-w-md font-body text-lg text-ink-muted">
          El ranking interno de la barra. Rango, racha y estadísticas de cada partida, en vivo.
        </p>
      </div>

      {user ? (
        <PodiumHero entries={entries} />
      ) : (
        <p className="font-body text-ink-muted">
          Inicia sesión para ver el podio y el ranking del grupo.
        </p>
      )}

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
