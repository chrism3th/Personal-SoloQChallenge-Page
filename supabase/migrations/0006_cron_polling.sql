-- SoloQ Arena — cron jobs en la base
-- Usa pg_cron + pg_net para llamar a los endpoints del sitio desde la DB.

create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table app_settings
  add column if not exists cron_secret text;

update app_settings
  set cron_secret = '/6JRHF9KTxa3pHfpFOIIAH2sWyBubA79brysPtH0DBc='
  where id = true;

alter table app_settings
  alter column cron_secret set not null;

create or replace function public.get_cron_secret()
returns text
language sql
security definer
set search_path = public
as $$
  select cron_secret
  from app_settings
  where id = true;
$$;

create or replace function public.trigger_poll_matches()
returns bigint
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_secret text;
begin
  select public.get_cron_secret() into v_secret;

  if v_secret is null or length(trim(v_secret)) = 0 then
    raise exception 'cron_secret no configurado';
  end if;

  return net.http_get(
    url := 'https://personal-solo-q-challenge-page.vercel.app/api/cron/poll-matches',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret),
    timeout_milliseconds := 5000
  );
end;
$$;

create or replace function public.trigger_poll_live_status()
returns bigint
language plpgsql
security definer
set search_path = public, net
as $$
declare
  v_secret text;
begin
  select public.get_cron_secret() into v_secret;

  if v_secret is null or length(trim(v_secret)) = 0 then
    raise exception 'cron_secret no configurado';
  end if;

  return net.http_get(
    url := 'https://personal-solo-q-challenge-page.vercel.app/api/cron/poll-live-status',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret),
    timeout_milliseconds := 5000
  );
end;
$$;

do $$
begin
  begin
    perform cron.unschedule('poll-matches-every-12-minutes');
  exception
    when others then null;
  end;

  begin
    perform cron.unschedule('poll-live-status-every-3-minutes');
  exception
    when others then null;
  end;
end;
$$;

select cron.schedule(
  'poll-matches-every-12-minutes',
  '*/12 * * * *',
  $$select public.trigger_poll_matches();$$
);

select cron.schedule(
  'poll-live-status-every-3-minutes',
  '*/3 * * * *',
  $$select public.trigger_poll_live_status();$$
);