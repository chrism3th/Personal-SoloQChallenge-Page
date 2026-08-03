import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicPodium } from "@/lib/ranking/public-summary";
import { buildGroupSummary } from "@/lib/ranking/group-summary";
import { getCurrentSeason, getLadder } from "@/lib/ranking/season-scope";
import { getLatestDdragonVersion } from "@/lib/riot/ddragon";
import { PodiumHero } from "@/components/ladder/PodiumHero";
import { GroupSummaryPanel } from "@/components/ladder/GroupSummaryPanel";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // La portada es pública (ver getPublicPodium): no depende de sesión, así que
  // el resumen del grupo también se arma con el cliente admin. El resto del
  // sitio (ladder completo, perfiles, temporadas) sigue protegido por login.
  const admin = createAdminClient();
  const [{ seasonName, entries }, version, season] = await Promise.all([
    getPublicPodium(),
    getLatestDdragonVersion(),
    getCurrentSeason(admin),
  ]);
  const ladder = await getLadder(admin, season);
  const summary = await buildGroupSummary(admin, ladder, season);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-16">
      <Reveal className="flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          LAS · {seasonName ?? "Ladder interno"}
        </p>
        <h1 className="font-display text-6xl uppercase tracking-wide sm:text-8xl">
          SoloCumChallenge
        </h1>
        <p className="max-w-md font-body text-lg text-ink-muted">
          El ranking interno de la barra. Rango, racha y estadísticas de cada partida, en vivo.
        </p>
      </Reveal>

      <PodiumHero entries={entries} />

      {ladder.length > 0 && (
        <Reveal>
          <GroupSummaryPanel summary={summary} version={version} />
        </Reveal>
      )}

      <Reveal className="flex justify-center gap-3">
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
      </Reveal>
    </main>
  );
}
