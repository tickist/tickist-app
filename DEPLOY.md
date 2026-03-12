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
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
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
supabase functions deploy enqueue-notification
supabase functions deploy send-emails
```

5. Skonfiguruj Auth SMTP w Dashboard:

- `Authentication -> SMTP Settings`
- Host/port/user/pass z AWS SES SMTP credentials
- Sender email: `no-reply@tickist.com`

6. Skonfiguruj harmonogram `send-emails`:

- Dashboard Scheduled Functions, albo
- `pg_cron + pg_net` (przykład w `docs/EMAIL.md`)

## Automatyzacja w GitHub Actions

Workflow produkcyjny (`.github/workflows/production.yml`) automatycznie:

- pushuje migracje,
- synchronizuje sekrety funkcji przez `supabase secrets set`,
- deployuje funkcje edge (w tym `enqueue-notification` i `send-emails`).

Wymagane GitHub Secrets dla mailingu:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_REMOTE_DB_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
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

Wymagane zmienne dla skryptu:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
