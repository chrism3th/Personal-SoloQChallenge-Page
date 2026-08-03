import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";
import { NavLinks, type NavItem } from "./NavLinks";

const NAV_ITEMS: NavItem[] = [
  { href: "/ladder", label: "Ladder" },
  { href: "/comparar", label: "Comparar" },
  { href: "/temporadas", label: "Temporadas" },
];

/**
 * Sesión del visitante, tolerante a fallos.
 *
 * Si Supabase no responde (red caída, credenciales de relleno en un entorno
 * de desarrollo), antes la excepción subía y tumbaba **toda** la página,
 * porque el Header se renderiza en el layout raíz. Un error de sesión debe
 * degradar a "visitante sin sesión", no a página en blanco.
 */
async function getViewer() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { user: null, profile: null };

    const { data: profile } = await supabase
      .from("profiles")
      .select("slug, is_admin")
      .eq("id", user.id)
      .single();

    return { user, profile };
  } catch {
    return { user: null, profile: null };
  }
}

export async function Header() {
  const { user, profile } = await getViewer();

  const navItems: NavItem[] = user ? [...NAV_ITEMS] : [];
  if (profile?.is_admin) navItems.push({ href: "/admin", label: "Admin" });
  if (user && profile) navItems.push({ href: `/jugador/${profile.slug}`, label: "Mi perfil" });

  return (
    // Fijo y con desenfoque: en el ladder largo la navegación se perdía al
    // bajar y había que volver arriba del todo para cambiar de sección.
    <header className="sticky top-0 z-40 border-b border-obsidian-700 bg-obsidian-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link
          href="/"
          className="focus-ring w-fit shrink-0 whitespace-nowrap font-display text-lg uppercase tracking-wide text-accent transition-colors hover:text-accent-bright sm:text-2xl"
        >
          SoloCumChallenge
        </Link>

        <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 font-body text-xs uppercase tracking-wide sm:gap-x-2 sm:text-sm">
          <NavLinks items={navItems} />
          {user ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="focus-ring rounded-full px-3 py-1 text-accent transition-colors hover:text-accent-bright sm:px-2.5"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
