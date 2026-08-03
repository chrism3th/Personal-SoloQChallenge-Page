import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/ladder", label: "Ladder" },
  { href: "/temporadas", label: "Temporadas" },
];

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { slug: string; is_admin: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("slug, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="border-b border-obsidian-700">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
        <Link
          href="/"
          className="focus-ring w-fit shrink-0 whitespace-nowrap font-display text-lg uppercase tracking-wide text-accent sm:text-2xl"
        >
          SoloCumChallenge
        </Link>

        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs uppercase tracking-wide sm:gap-4 sm:text-sm">
          {user &&
            NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring rounded-full px-3 py-1 text-ink-muted hover:text-ink sm:px-2"
              >
                {item.label}
              </Link>
            ))}
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="focus-ring rounded-full px-3 py-1 text-ink-muted hover:text-ink sm:px-2"
            >
              Admin
            </Link>
          )}
          {user && profile && (
            <Link
              href={`/jugador/${profile.slug}`}
              className="focus-ring rounded-full px-3 py-1 text-ink-muted hover:text-ink sm:px-2"
            >
              Mi perfil
            </Link>
          )}
          {user ? (
            <LogoutButton />
          ) : (
            <Link
              href="/login"
              className="focus-ring rounded-full px-3 py-1 text-accent hover:text-accent-bright sm:px-2"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
