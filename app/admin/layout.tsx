import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/invitaciones", label: "Invitaciones" },
  { href: "/admin/api-key", label: "Riot API Key" },
  { href: "/admin/temporadas", label: "Temporadas" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/ladder");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Panel admin</p>
        <h1 className="font-display text-4xl uppercase tracking-wide">SoloCumChallenge</h1>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-obsidian-700 pb-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="focus-ring rounded-full px-3 py-1.5 font-body text-sm uppercase tracking-wide text-ink-muted hover:bg-obsidian-800 hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </main>
  );
}
