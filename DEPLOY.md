# Deploy guide

## Email stack deploy (SES + Supabase)

1. Połącz projekt:

```bash
supabase link --project-ref <PROJECT_REF>
```

2. Wypchnij migracje:

```bash
supabase db push --db-url "$SUPABASE_REMOTE_DB_URL"
```

3. Ustaw sekrety funkcji:

```bash
supabase secrets set \
  SUPABASE_SECRET_KEY="$SUPABASE_SECRET_KEY" \
  INTERNAL_FUNCTION_SECRET="$INTERNAL_FUNCTION_SECRET" \
  SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY" \
  EMAIL_FROM="no-reply@tickist.com" \
  AWS_REGION="eu-central-1" \
  AWS_ACCESS_KEY_ID="<AWS_ACCESS_KEY_ID>" \
  AWS_SECRET_ACCESS_KEY="<AWS_SECRET_ACCESS_KEY>" \
  SES_CONFIGURATION_SET="<OPTIONAL_CONFIGURATION_SET>" \
  EMAIL_RATE_LIMIT_PER_MINUTE="1" \
  EMAIL_RATE_LIMIT_PER_HOUR="60" \
  EMAIL_RATE_LIMIT_PER_DAY="500"
```

4. Deploy edge functions:

```bash
supabase functions deploy notification-digest-runner
supabase functions deploy enqueue-notification
supabase functions deploy send-emails
```

5. Skonfiguruj Auth SMTP w Dashboard:

- `Authentication -> SMTP Settings`
- Host/port/user/pass z AWS SES SMTP credentials
- Sender email: `no-reply@tickist.com`

6. Skonfiguruj harmonogramy notyfikacji:

- Dashboard Scheduled Functions, albo
- `pg_cron + pg_net` (przykład w `docs/EMAIL.md`)

Wymagane są dwa osobne harmonogramy:

- `notification-digest-runner` co 5-15 minut:
  - `POST https://<PROJECT_REF>.supabase.co/functions/v1/notification-digest-runner`
  - header `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`
  - bez body
- `send-emails` co 1 minutę:
  - `POST https://<PROJECT_REF>.supabase.co/functions/v1/send-emails`
  - header `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`
  - body: `{"limit":25,"dry_run":false}`

## Automatyzacja w GitHub Actions

Workflow produkcyjny (`.github/workflows/production.yml`) automatycznie:

- pushuje migracje,
- synchronizuje sekrety funkcji przez `supabase secrets set`,
- deployuje funkcje edge (w tym `notification-digest-runner`,
  `enqueue-notification` i `send-emails`).

Workflow nie tworzy harmonogramów Scheduled Functions. Po pierwszym deployu
upewnij się w Supabase Dashboard albo w `pg_cron`, że oba harmonogramy z kroku
6 istnieją i używają aktualnego `INTERNAL_FUNCTION_SECRET`.

Wymagane GitHub Secrets dla mailingu:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_REMOTE_DB_URL`
- `SUPABASE_SECRET_KEY`
- `INTERNAL_FUNCTION_SECRET`
- `SUPABASE_PUBLISHABLE_KEY`
- `EMAIL_FROM`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Opcjonalne GitHub Secrets:

- `AWS_SESSION_TOKEN`
- `SES_CONFIGURATION_SET`
- `EMAIL_RATE_LIMIT_PER_MINUTE`
- `EMAIL_RATE_LIMIT_PER_HOUR`
- `EMAIL_RATE_LIMIT_PER_DAY`

## Smoke test po deployu

Uruchom:

```bash
./scripts/email-smoke-test.sh
```

Smoke test sprawdza bezpośrednie kolejkowanie przez `enqueue-notification` i
dry-run `send-emails`. Dodatkowo sprawdź digest runner ręcznie dla użytkownika,
który ma włączony `Weekly summary` albo `Daily summary`:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/notification-digest-runner" \
  -H "x-internal-function-secret: $INTERNAL_FUNCTION_SECRET" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

Oczekuj odpowiedzi `200` z polami `processed`, `enqueued`, `skipped`. Po
uruchomieniu sprawdź w DB, czy w `public.email_outbox` pojawił się rekord
`queued`, a po `send-emails` przeszedł na `sent` albo ma konkretny `last_error`.

Wymagane zmienne dla skryptu:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `INTERNAL_FUNCTION_SECRET`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Tymczasowy rollout fallback:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ROUTINE_RUNNER_SECRET`
- `SUPABASE_ANON_KEY`
