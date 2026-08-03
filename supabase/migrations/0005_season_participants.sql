-- SoloQ Arena — roster por temporada: qué perfiles participan en cada
-- temporada/torneo. Sin esto el ladder mostraba TODOS los perfiles activos
-- sin importar la temporada — el admin no podía controlar quién compite en
-- cada torneo.

create table season_participants (
  season_id uuid not null references seasons(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (season_id, profile_id)
);

create index season_participants_profile_idx on season_participants (profile_id);

alter table season_participants enable row level security;

create policy "season_participants_select" on season_participants
  for select using (auth.role() = 'authenticated');

create policy "season_participants_admin_all" on season_participants
  for all
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- Backfill: las temporadas que ya existen (creadas antes de este roster
-- explícito) quedan con todos los perfiles activos como participantes, para
-- no vaciar de golpe un ladder que ya está en curso. Las temporadas nuevas
-- que se creen de acá en adelante arrancan sin roster — el admin elige a
-- mano quién participa.
insert into season_participants (season_id, profile_id)
select s.id, p.id
from seasons s
cross join profiles p
where p.is_active
on conflict do nothing;
