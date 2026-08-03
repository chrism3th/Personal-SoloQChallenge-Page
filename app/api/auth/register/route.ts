import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccountByRiotId } from "@/lib/riot/account";
import { RiotApiError } from "@/lib/riot/client";
import { pollProfileMatches } from "@/lib/riot/poll";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeInviteCode } from "@/lib/auth/invites";
import { dedupeSlug, riotIdToSlug } from "@/lib/utils/slug";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  inviteCode: z.string().min(4),
  gameName: z.string().trim().min(1).max(32),
  tagLine: z.string().trim().min(1).max(10),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de registro inválidos." },
      { status: 400 }
    );
  }
  const { email, password, gameName, tagLine } = parsed.data;
  const inviteCode = normalizeInviteCode(parsed.data.inviteCode);

  const supabase = createAdminClient();

  // 1. Pre-chequeo del código (no lo consume todavía: eso pasa recién
  //    cuando ya existe un user_id real, vía la RPC redeem_invite).
  const { data: invite } = await supabase
    .from("invites")
    .select("id, expires_at, uses_count, max_uses")
    .eq("code", inviteCode)
    .maybeSingle();

  if (
    !invite ||
    (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) ||
    invite.uses_count >= invite.max_uses
  ) {
    return NextResponse.json(
      { error: "Código de invitación inválido, expirado o ya utilizado." },
      { status: 400 }
    );
  }

  // 2. Resolver el Riot ID en el servidor (no confiar en un puuid que
  //    venga del cliente).
  let account;
  try {
    account = await getAccountByRiotId(gameName, tagLine);
  } catch (err) {
    if (err instanceof RiotApiError && err.status === 404) {
      return NextResponse.json(
        { error: "No encontramos ese Riot ID en LAS. Verifica el nombre y el tag." },
        { status: 404 }
      );
    }
    console.error("register: error resolviendo Riot ID", err);
    return NextResponse.json(
      { error: "No se pudo verificar el Riot ID. Intenta de nuevo en unos segundos." },
      { status: 502 }
    );
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("riot_puuid", account.puuid)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json(
      { error: "Esta cuenta de Riot ya está vinculada a otro usuario." },
      { status: 409 }
    );
  }

  // 3. Crear el usuario en Supabase Auth.
  const { data: created, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError || !created.user) {
    const message =
      createUserError?.code === "email_exists"
        ? "Ya existe una cuenta con ese email."
        : "No se pudo crear la cuenta. Intenta de nuevo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const userId = created.user.id;

  // Compensación manual: si algo falla después de crear el auth user
  // (no hay transacción entre Auth y Postgres), lo eliminamos.
  async function rollbackUser() {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
  }

  // 4. Insertar el profile con slug único.
  const { data: existingSlugs } = await supabase.from("profiles").select("slug");
  const slugSet = new Set((existingSlugs ?? []).map((row) => row.slug));
  const baseSlug = riotIdToSlug(account.gameName ?? gameName, account.tagLine ?? tagLine);
  const slug = dedupeSlug(baseSlug, slugSet);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      riot_puuid: account.puuid,
      riot_game_name: account.gameName ?? gameName,
      riot_tag_line: account.tagLine ?? tagLine,
      slug,
    })
    .select("*")
    .single();

  if (profileError || !profile) {
    console.error("register: error creando profile", profileError);
    await rollbackUser();
    return NextResponse.json(
      { error: "No se pudo completar el registro. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // 5. Consumir el código de invitación de forma atómica (RPC con lock).
  const { data: redeemed, error: redeemError } = await supabase.rpc("redeem_invite", {
    p_code: inviteCode,
    p_user_id: userId,
  });

  if (redeemError || !redeemed) {
    console.error("register: invite no pudo consumirse", redeemError);
    await supabase.from("profiles").delete().eq("id", userId);
    await rollbackUser();
    return NextResponse.json(
      { error: "El código de invitación ya no está disponible. Pide uno nuevo." },
      { status: 409 }
    );
  }

  // 6. Poll inicial best-effort: si la Riot API key aún no está lista o
  // falla, el usuario simplemente aparece vacío hasta el próximo cron.
  pollProfileMatches(supabase, profile).catch((err) => {
    console.error("register: poll inicial falló (no bloqueante)", err);
  });

  return NextResponse.json({ ok: true, slug: profile.slug });
}
