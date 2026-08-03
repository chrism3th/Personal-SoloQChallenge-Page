-- SoloQ Arena — esquema inicial
-- Requiere: proyecto Supabase con auth.users ya disponible (Supabase Auth).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- app_settings: fila única (singleton) con la Riot API key vigente.
-- El id boolean con default true + check fuerza que solo pueda existir
-- una fila en la tabla.
-- ---------------------------------------------------------------------
create table app_settings (
  id boolean primary key default true check (id),
  riot_api_key text not null,
  riot_api_key_status text not null default 'unknown' check (riot_api_key_status in ('unknown', 'valid', 'invalid')),
  riot_api_key_updated_at timestamptz not null default now(),
  riot_api_key_updated_by uuid references auth.users(id),
  platform_routing text not null default 'la2',
  regional_routing text not null default 'americas',
  created_at timestamptz not null default now()
);

insert into app_settings (id, riot_api_key) values (true, 'PENDING_SET_IN_ADMIN_PANEL');

-- ---------------------------------------------------------------------
-- profiles: un amigo registrado, vinculado 1:1 a auth.users y a su
-- cuenta de Riot Games.
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  riot_puuid text unique not null,
  riot_game_name text not null,
  riot_tag_line text not null,
  slug text unique not null,
  summoner_id text,
  profile_icon_id int,
  display_name text,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  last_polled_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_puuid_idx on profiles (riot_puuid);
create index profiles_slug_idx on profiles (slug);

-- ---------------------------------------------------------------------
-- invites: códigos de invitación generados por un admin.
-- ---------------------------------------------------------------------
create table invites (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid not null references auth.users(id),
  used_by uuid references auth.users(id),
  used_at timestamptz,
  expires_at timestamptz,
  max_uses int not null default 1,
  uses_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- seasons: temporadas/challenges configurables por el admin.
-- ---------------------------------------------------------------------
create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_closed boolean not null default false,
  is_current boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index seasons_current_idx on seasons (is_current) where is_current;

-- ---------------------------------------------------------------------
-- lp_snapshots: histórico de rango/LP tomado por el cron. Fuente de
-- verdad para el gráfico de LP y para los deltas de progreso.
-- ---------------------------------------------------------------------
create table lp_snapshots (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  queue_type text not null default 'RANKED_SOLO_5x5',
  tier text not null,
  division text,
  league_points int not null,
  wins int not null,
  losses int not null,
  taken_at timestamptz not null default now()
);

create index lp_snapshots_profile_time_idx on lp_snapshots (profile_id, taken_at desc);

-- ---------------------------------------------------------------------
-- matches / match_participants: partidas ranked procesadas por el cron.
-- ---------------------------------------------------------------------
create table matches (
  id text primary key,
  game_creation timestamptz not null,
  game_duration int not null,
  queue_id int not null,
  patch_version text,
  raw jsonb,
  fetched_at timestamptz not null default now()
);

create index matches_game_creation_idx on matches (game_creation desc);

create table match_participants (
  id bigint generated always as identity primary key,
  match_id text not null references matches(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  puuid text not null,
  champion_id int not null,
  champion_name text not null,
  role text,
  team_position text,
  win boolean not null,
  kills int not null,
  deaths int not null,
  assists int not null,
  cs int not null,
  vision_score int,
  unique (match_id, profile_id)
);

create index match_participants_profile_idx on match_participants (profile_id, match_id);

-- ---------------------------------------------------------------------
-- live_status: cache del spectator polling ("en partida ahora").
-- ---------------------------------------------------------------------
create table live_status (
  profile_id uuid primary key references profiles(id) on delete cascade,
  is_live boolean not null default false,
  game_mode text,
  game_start_time timestamptz,
  champion_id int,
  checked_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- season_results: snapshot inmutable del ranking al cerrar una temporada.
-- ---------------------------------------------------------------------
create table season_results (
  id bigint generated always as identity primary key,
  season_id uuid not null references seasons(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  final_rank int not null,
  tier text not null,
  division text,
  league_points int not null,
  wins int not null,
  losses int not null,
  created_at timestamptz not null default now(),
  unique (season_id, profile_id)
);

create index season_results_season_idx on season_results (season_id, final_rank);
