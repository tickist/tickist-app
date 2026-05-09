# Tickist

[![CI](https://github.com/tickist/tickist-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/tickist/tickist-app/actions/workflows/ci.yml)

Tickist to aplikacja do zarządzania zadaniami i projektami, oparta o Angular + Supabase.
Projekt jest rozwijany jako monorepo Nx, ale aktywnie utrzymywana jest jedna aplikacja: `tickist-web`.

## Czym jest ten projekt

Tickist skupia się na codziennej organizacji pracy:

- zadania z terminami, priorytetami i opisami,
- projekty (także hierarchiczne),
- tagi i filtrowanie,
- kroki/subtaski,
- reguły powtarzania,
- ustawienia konta i preferencje użytkownika,
- notyfikacje email przez Supabase Edge Functions + AWS SES.

## Stack techniczny

- Angular 21 (standalone components, sygnały)
- Nx 22
- Vite + Vitest
- TailwindCSS + DaisyUI
- Supabase (Postgres, Auth, Storage, Edge Functions)
- Playwright (E2E)

## Struktura repo

- `apps/tickist-web/` - główna aplikacja frontendowa
- `apps/tickist-web/src/app/` - feature modules (`auth`, `app-shell`, `dashboard`, `tags`, `task-fab`) oraz `core` i `data`
- `supabase/migrations/` - migracje bazy
- `supabase/functions/` - edge functions
- `docs/` - dokumentacja operacyjna (np. email/SES)

## Szybki start lokalny

1. Zainstaluj zależności:

```bash
npm install
```

2. Przygotuj pliki środowiskowe:

```bash
cp .env.example .env
cp .env.example .local_env
```

3. Uzupełnij wymagane zmienne (`.local_env`):

- `NG_APP_SUPABASE_URL`
- `NG_APP_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_DB_URL`
- `SUPABASE_E2E_DB_URL`
- `SUPABASE_REMOTE_DB_URL`
- `SUPABASE_SECRET_KEY`
- `INTERNAL_FUNCTION_SECRET`

4. Uruchom aplikację:

```bash
npm run start
```

Aplikacja startuje na `http://localhost:4200`.

## Najważniejsze komendy

```bash
# development
npm run start

# build
npm run build

# testy jednostkowe
npm run test

# e2e
npm exec nx e2e tickist-web-e2e

# lint
npm exec nx lint tickist-web
```

## Workflow Supabase

```bash
# lokalna baza
npm run db:push:local
npm run db:pull:local
npm run db:types:local
npm run db:reset:local

# zdalna baza
npm run db:push:remote
npm run db:pull:remote
npm run db:types:remote
npm run db:reset:remote
```

Uruchamianie lokalnego Supabase:

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

## Email i notyfikacje

- Auth email (reset hasła, potwierdzenie konta) idzie przez SMTP skonfigurowane w Supabase.
- Notyfikacje aplikacyjne korzystają z outboxa `public.email_outbox` i funkcji:
  - `notification-digest-runner`
  - `enqueue-notification`
  - `send-emails`

Szczegóły:

- [docs/EMAIL.md](docs/EMAIL.md)
- [DEPLOY.md](DEPLOY.md)

## Jakość i CI

Przed PR uruchom:

```bash
npm exec nx format:check
npm exec nx lint tickist-web
npm exec nx test tickist-web
npm exec nx build tickist-web
```

## Dodatkowa dokumentacja

- [MIGRATION_PLAN.md](MIGRATION_PLAN.md) - plan migracji i decyzje architektoniczne
- [AGENTS.md](AGENTS.md) - zasady pracy w repo
