# SoloQ Arena · LAS

Ladder interno de SoloQ para un grupo cerrado de amigos, inspirado en el
formato del SoloQ Challenge de ElmiilloR: ranking por LP/rango, perfiles con
historial de rango y estadísticas de campeones, indicador de "en partida
ahora", y temporadas/challenges configurables.

Dirección visual: **"Neo Rank"** — fondo casi negro con tinte azulado,
paneles de vidrio redondeados, acento violeta eléctrico + cian, y cada
jugador con un halo del color real de su tier de LoL.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS v4**
- **Supabase** (Postgres + Auth) — ver `supabase/migrations/`
- **Riot Games API** (Account-v1, Summoner-v4, League-v4, Match-v5,
  Spectator-v5) + Data Dragon para assets
- Desplegado en **Vercel**, con **Vercel Cron** para el polling periódico

## Setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar Supabase local

Requiere Docker corriendo.

```bash
npx supabase start
```

Al terminar imprime la URL local, la `anon key` y la `service_role key`.
Copiá esos valores a `.env.local` (basado en `.env.local.example`):

```bash
cp .env.local.example .env.local
# editar .env.local con los valores que imprimió `supabase start`
```

Las migraciones (`supabase/migrations/`) se aplican automáticamente al
iniciar. Para reaplicarlas desde cero:

```bash
npx supabase db reset
```

### 3. Datos falsos para desarrollar sin la Riot API key

```bash
npm run seed
```

Genera 8 amigos falsos, dos temporadas (una cerrada, una activa) y varios
meses de historial de LP/partidas, para poder construir y revisar toda la UI
sin depender de la Riot API key. El primer amigo seedeado
(`pancho@example.test` / `arena12345`) queda marcado como admin de prueba.

### 4. Correr el sitio

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Con los datos de seed
ya deberías ver el podio en la landing, el `/ladder` completo y perfiles en
`/jugador/<slug>`.

### 5. Conectar la Riot API key real

Entrá como el admin de prueba y andá a `/admin/api-key` para pegar tu
**Personal API Key** de [developer.riotgames.com](https://developer.riotgames.com/).
Las Personal Keys expiran cada 24h — no hace falta redeploy para
actualizarla, se guarda en la tabla `app_settings`.

### 6. Correr el cron manualmente

En producción, `vercel.json` define los Cron Jobs. En local podés
dispararlos a mano (necesitás `CRON_SECRET` seteado en `.env.local`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/poll-matches
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/poll-live-status
```

### 7. Verificar las políticas de seguridad (RLS)

Después de correr `npm run seed`:

```bash
npm run verify:rls
```

Confirma que un usuario no-admin no puede leer configuración sensible,
crear invitaciones, ni auto-otorgarse permisos de admin, y que el cron
(`service_role`) sí puede escribir los datos de Riot.

## Estructura

- `app/` — páginas (App Router) y rutas API
- `components/` — UI por dominio (`ladder/`, `player/`, `admin/`, `ui/`, `shared/`, `layout/`)
- `lib/supabase/` — clientes Supabase (browser, server, admin/service-role)
- `lib/riot/` — integración con la Riot API (rate limiter, endpoints, polling)
- `lib/ranking/` — lógica de ranking, temporadas y rachas
- `supabase/migrations/` — esquema y RLS
- `scripts/` — seed de datos falsos y smoke test de RLS

## Deploy

1. Crear un proyecto en [supabase.com](https://supabase.com), correr las
   migraciones (`supabase db push` o pegarlas en el SQL editor).
2. Deployar en Vercel, configurando las env vars de `.env.local.example`
   (Supabase + `CRON_SECRET` + `ADMIN_EMAIL`). `vercel.json` ya define los
   dos Cron Jobs — ojo, corren cada 3 y 12 minutos, lo cual excede el límite
   de cron del plan gratuito de Vercel (solo permite 1 ejecución/día); hace
   falta plan Pro o superior para que el polling funcione a esa frecuencia.
3. Crear el primer usuario admin registrándote en `/registro` con el email
   que pusiste en `ADMIN_EMAIL` — no hace falta código de invitación para
   ese primer registro, y queda admin automáticamente. (Si no configuraste
   `ADMIN_EMAIL`, la alternativa es insertar un código a mano en la tabla
   `invites` desde el SQL editor y marcar `profiles.is_admin = true` a
   mano después de registrarte.)
4. Entrar a `/admin/api-key` y pegar tu Riot API key.
5. Crear una temporada en `/admin/temporadas` y marcar ahí mismo qué
   jugadores participan — el ladder de una temporada solo muestra su
   roster explícito, no todos los perfiles activos.
