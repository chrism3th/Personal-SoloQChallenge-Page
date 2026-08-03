import { createClient } from "@/lib/supabase/server";
import { InviteGenerator } from "@/components/admin/InviteGenerator";
import { formatRelativeTime } from "@/lib/utils/format";

export default async function AdminInvitacionesPage() {
  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <InviteGenerator />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-obsidian-700 text-left text-ink-muted">
              <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">Código</th>
              <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">Estado</th>
              <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">Creado</th>
              <th className="py-2 pr-4 font-body text-xs uppercase tracking-widest">Expira</th>
            </tr>
          </thead>
          <tbody>
            {(invites ?? []).map((invite) => {
              const used = invite.uses_count >= invite.max_uses;
              const expired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
              return (
                <tr key={invite.id} className="border-b border-obsidian-800">
                  <td className="py-2 pr-4 tracking-[0.2em]">{invite.code}</td>
                  <td className="py-2 pr-4">
                    {used ? (
                      <span className="text-ink-muted">usado</span>
                    ) : expired ? (
                      <span className="text-loss">expirado</span>
                    ) : (
                      <span className="text-win">disponible</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {formatRelativeTime(invite.created_at)}
                  </td>
                  <td className="py-2 pr-4 text-ink-muted">
                    {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString("es-CL") : "nunca"}
                  </td>
                </tr>
              );
            })}
            {(invites ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-ink-muted">
                  Todavía no hay invitaciones generadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
