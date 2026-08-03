-- SoloQ Arena — grants de nivel de tabla.
--
-- Supabase (self-hosted y local vía `supabase start`) NO otorga SELECT/
-- INSERT/UPDATE/DELETE por defecto a los roles `anon`/`authenticated`/
-- `service_role` sobre tablas creadas por migraciones SQL crudas (a
-- diferencia de crear una tabla desde el Table Editor de Studio, que sí
-- agrega estos grants automáticamente). Sin este grant, cualquier query
-- falla con "permission denied for table X" ANTES de que las políticas
-- RLS lleguen a evaluarse.
--
-- `authenticated` recibe DML de tabla completo aquí; las policies de
-- supabase/migrations/0002_rls_policies.sql siguen siendo las que deciden
-- fila por fila qué puede leer/escribir realmente cada usuario. `anon` no
-- recibe ningún grant a propósito: este es un sitio privado y ninguna
-- tabla debe ser legible sin sesión.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
