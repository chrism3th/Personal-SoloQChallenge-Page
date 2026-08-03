-- SoloQ Arena — Row Level Security
-- Sitio privado de amigos: lectura para cualquier usuario autenticado,
-- escritura restringida a admin o a service_role (cron/admin backend).

alter table app_settings enable row level security;
alter table profiles enable row level security;
alter table invites enable row level security;
alter table seasons enable row level security;
alter table lp_snapshots enable row level security;
alter table matches enable row level security;
alter table match_participants enable row level security;
alter table live_status enable row level security;
alter table season_results enable row level security;

-- ---------------------------------------------------------------------
-- Helper: ¿el usuario es admin?
-- ---------------------------------------------------------------------
create or replace function is_admin(uid uuid) returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from profiles p where p.id = uid), false);
$$;

-- ---------------------------------------------------------------------
-- app_settings: solo admin lee/escribe (contiene la API key en texto plano).
-- El cron NO pasa por aquí — usa el cliente service_role, que bypassa RLS.
-- ---------------------------------------------------------------------
create policy "app_settings_admin_all" on app_settings
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- profiles: cualquier autenticado lee el ladder completo; cada usuario
-- puede editar campos cosméticos de su propia fila (is_admin/is_active
-- quedan protegidos por trigger, no por la policy); admin gestiona todo.
-- ---------------------------------------------------------------------
create policy "profiles_select_authenticated" on profiles
  for select
  using (auth.role() = 'authenticated');

create policy "profiles_update_own" on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_admin_all" on profiles
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- Un usuario no-admin no debe poder auto-otorgarse privilegios vía
-- `update profiles set is_admin = true where id = auth.uid()`, algo que
-- la policy de arriba por sí sola no impide (RLS no filtra por columna).
create or replace function protect_profile_privileges() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin(auth.uid()) then
    if new.is_admin is distinct from old.is_admin then
      new.is_admin := old.is_admin;
    end if;
    if new.is_active is distinct from old.is_active then
      new.is_active := old.is_active;
    end if;
    if new.riot_puuid is distinct from old.riot_puuid then
      new.riot_puuid := old.riot_puuid;
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileges
  before update on profiles
  for each row execute function protect_profile_privileges();

-- ---------------------------------------------------------------------
-- invites: solo admin lee/crea directamente. La validación/consumo de un
-- código durante el registro pasa por la función redeem_invite() de abajo,
-- que corre con privilegios elevados y no expone la tabla completa.
-- ---------------------------------------------------------------------
create policy "invites_admin_all" on invites
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- seasons: lectura pública (autenticados), escritura solo admin.
-- ---------------------------------------------------------------------
create policy "seasons_select_authenticated" on seasons
  for select
  using (auth.role() = 'authenticated');

create policy "seasons_admin_insert" on seasons
  for insert
  with check (is_admin(auth.uid()));

create policy "seasons_admin_update" on seasons
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- Datos de Riot (lp_snapshots, matches, match_participants, live_status):
-- lectura pública autenticada; sin policies de insert/update/delete, por
-- lo que solo el cliente service_role (que bypassa RLS) puede escribir.
-- ---------------------------------------------------------------------
create policy "lp_snapshots_select" on lp_snapshots
  for select using (auth.role() = 'authenticated');

create policy "matches_select" on matches
  for select using (auth.role() = 'authenticated');

create policy "match_participants_select" on match_participants
  for select using (auth.role() = 'authenticated');

create policy "live_status_select" on live_status
  for select using (auth.role() = 'authenticated');

create policy "season_results_select" on season_results
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- redeem_invite: valida y consume atómicamente un código de invitación
-- durante el registro, sin exponer la tabla invites a usuarios anónimos.
-- ---------------------------------------------------------------------
create or replace function redeem_invite(p_code text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
begin
  select * into v_invite from invites
    where code = p_code
      and (expires_at is null or expires_at > now())
      and uses_count < max_uses
    for update;

  if not found then
    return false;
  end if;

  update invites
    set uses_count = uses_count + 1,
        used_by = p_user_id,
        used_at = now()
    where id = v_invite.id;

  return true;
end;
$$;

grant execute on function redeem_invite(text, uuid) to authenticated, anon;

-- ---------------------------------------------------------------------
-- close_season: congela el ranking final de una temporada en
-- season_results a partir del último lp_snapshot de cada jugador dentro
-- del rango de la temporada. La fórmula de rank_value replicada aquí en
-- SQL debe mantenerse en sync con lib/ranking/lp-math.ts.
-- ---------------------------------------------------------------------
create or replace function close_season(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_season seasons%rowtype;
begin
  if not is_admin(auth.uid()) then
    raise exception 'Solo un admin puede cerrar una temporada';
  end if;

  select * into v_season from seasons where id = p_season_id;
  if not found then
    raise exception 'Temporada % no encontrada', p_season_id;
  end if;

  update seasons
    set ends_at = coalesce(ends_at, now()),
        is_closed = true,
        is_current = false
    where id = p_season_id;

  insert into season_results (season_id, profile_id, final_rank, tier, division, league_points, wins, losses)
  select
    p_season_id,
    ranked.profile_id,
    row_number() over (order by ranked.rank_value desc) as final_rank,
    ranked.tier,
    ranked.division,
    ranked.league_points,
    ranked.wins,
    ranked.losses
  from (
    select distinct on (ls.profile_id)
      ls.profile_id,
      ls.tier,
      ls.division,
      ls.league_points,
      ls.wins,
      ls.losses,
      (case ls.tier
        when 'CHALLENGER' then 9 when 'GRANDMASTER' then 8 when 'MASTER' then 7
        when 'DIAMOND' then 6 when 'EMERALD' then 5 when 'PLATINUM' then 4
        when 'GOLD' then 3 when 'SILVER' then 2 when 'BRONZE' then 1 else 0
      end) * 10000
      + (case ls.division when 'I' then 3 when 'II' then 2 when 'III' then 1 else 0 end) * 1000
      + ls.league_points as rank_value
    from lp_snapshots ls
    join profiles p on p.id = ls.profile_id
    where ls.taken_at between v_season.starts_at and coalesce(v_season.ends_at, now())
      and p.is_active
    order by ls.profile_id, ls.taken_at desc
  ) ranked
  on conflict (season_id, profile_id) do update
    set final_rank = excluded.final_rank,
        tier = excluded.tier,
        division = excluded.division,
        league_points = excluded.league_points,
        wins = excluded.wins,
        losses = excluded.losses;
end;
$$;

grant execute on function close_season(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Garantiza una sola temporada is_current = true a la vez.
-- ---------------------------------------------------------------------
create or replace function enforce_single_current_season() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_current then
    update seasons set is_current = false where id <> new.id and is_current;
  end if;
  return new;
end;
$$;

create trigger seasons_single_current
  before insert or update on seasons
  for each row execute function enforce_single_current_season();
