import Link from "next/link";

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Competencia",
    links: [
      { href: "/ladder", label: "Ladder" },
      { href: "/comparar", label: "Comparar jugadores" },
    ],
  },
  {
    title: "Historia",
    links: [
      { href: "/temporadas", label: "Temporadas" },
      { href: "/temporadas/salon", label: "Salón de la fama" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-obsidian-700 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg uppercase tracking-wide text-accent">
            SoloCumChallenge
          </p>
          <p className="max-w-xs font-body text-sm text-ink-muted">
            Ladder interno de SoloQ del grupo. Rango, racha y estadísticas de cada partida.
          </p>
        </div>

        <div className="flex gap-10">
          {SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col gap-2">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                {section.title}
              </p>
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="focus-ring w-fit rounded-chip font-body text-sm text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-7xl px-4 font-mono text-xs text-ink-muted">
        LAS — no afiliado a Riot Games.
      </p>
    </footer>
  );
}
