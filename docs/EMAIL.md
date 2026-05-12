# Email delivery (Supabase Auth + SES Outbox)

Ten dokument opisuje produkcyjne ustawienie wysyłki emaili w Tickist:

- **Supabase Auth** (reset hasła, magic link, potwierdzenie email): przez **SMTP AWS SES** skonfigurowany w Supabase Dashboard.
- **Notyfikacje aplikacyjne**: kolejka `public.email_outbox` + Edge Functions `notification-digest-runner`, `enqueue-notification` i `send-emails` wysyłające przez **AWS SES API (SigV4)**.

`From` jest zawsze ustawiany przez secret `EMAIL_FROM`, np. `no-reply@tickist.com`.

## 1) Auth SMTP przez SES

1. W AWS SES:

- Zweryfikuj domenę nadawczą (SES Console -> Verified identities -> your domain).
- Włącz DKIM dla domeny.
- Utwórz SMTP credentials (IAM user wygenerowany przez SES: SMTP username + SMTP password).

2. W Supabase Dashboard:

- Wejdź w `Authentication -> SMTP Settings`.
- Włącz custom SMTP i ustaw:
  - Host: endpoint SMTP SES dla regionu (np. `email-smtp.eu-central-1.amazonaws.com`)
  - Port: `587` (STARTTLS) lub `465` (TLS)
  - Username: SMTP username z SES
  - Password: SMTP password z SES
  - Sender email: `no-reply@tickist.com`
  - Sender name: np. `Tickist`

3. W `Authentication -> Rate Limits` ustaw limity Auth odpowiednie do ruchu.

Uwagi:

- Supabase Auth SMTP jest niezależne od workerów outbox.
- Dla produkcji nie używaj domyślnego SMTP Supabase.

## 2) Notyfikacje aplikacyjne (digest/enqueue + batch sender)

Architektura:

1. Klient/user zapisuje preferencje w `public.notification_preferences`.
2. Harmonogram wywołuje `notification-digest-runner` co 5-15 minut.
3. Runner sprawdza preferencje daily/weekly, buduje digest i zapisuje rekord do `public.email_outbox` przez `public.enqueue_email(...)`.
4. Opcjonalnie klient/user może wywołać `enqueue-notification`, żeby dodać pojedynczy email do outbox.
5. Harmonogram wywołuje `send-emails` co 1 minutę.
6. Worker pobiera batch, wysyła przez SES API, aktualizuje statusy i retry.

Zasady bezpieczeństwa:

- `enqueue-notification`:
  - wymaga JWT użytkownika,
  - nie akceptuje `to_email` w body (400),
  - bierze odbiorcę wyłącznie z `auth user` (JWT/`auth.admin.getUserById`),
  - wymaga potwierdzonego emaila (`email_confirmed_at`),
  - wymusza, aby `dedupe_key` zawierał `userId`.
- `send-emails`:
  - działa tylko z `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`.
- `notification-digest-runner`:
  - działa tylko z `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`,
  - wymaga `verify_jwt = false` w `supabase/config.toml`, tak samo jak `send-emails`.
- Tabela outbox ma RLS wyłącznie dla `service_role`.

Idempotencja i retry:

- `dedupe_key` ma unikalny indeks.
- `enqueue_email` używa `ON CONFLICT DO NOTHING`.
- Retry tylko dla błędów retryable (throttling/5xx) z exponential backoff i limitem prób.
- Po przekroczeniu limitu prób rekord przechodzi do `dead`.

## 3) DNS (Cloudflare + SES)

Nie wpisuj rekordów ręcznie „na pamięć”. Bierz dokładne wartości z SES:

1. **SES Domain verification + DKIM**

- AWS SES -> Verified identities -> wybierz domenę.
- Skopiuj rekordy wymagane przez SES:
  - TXT/CNAME do verification,
  - rekordy DKIM (CNAME).
- Wklej je w Cloudflare DNS dla tej samej domeny.

2. **SPF**

- Upewnij się, że domena ma poprawny rekord SPF i uwzględnia SES zgodnie z zaleceniem AWS.
- Dodaj/zmodyfikuj rekord TXT SPF w Cloudflare.

3. **DMARC**

- Dodaj TXT `_dmarc.tickist.com` w Cloudflare.
- Na start można użyć polityki monitorującej (`p=none`), potem zaostrzać (`quarantine/reject`).

4. Zweryfikuj status w SES aż identity będzie `Verified`.

## 4) Harmonogramy notyfikacji

### Wariant A: migracja `pg_cron` + `pg_net` (produkcyjny)

Repo zarządza schedulerami w kodzie:

- `.github/workflows/production.yml` zapisuje do Supabase Vault:
  - `tickist_functions_base_url`
  - `tickist_internal_function_secret`
- `supabase/migrations/0012_schedule_notification_workers.sql` tworzy cron joby:
  - `notification-digest-runner-every-10-minutes`
  - `send-emails-every-minute`

Nie ustawiaj tych harmonogramów ręcznie w Dashboardzie, bo kolejne wdrożenie
powinno odtworzyć stan z migracji.

Po wdrożeniu sprawdź:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname in (
  'notification-digest-runner-every-10-minutes',
  'send-emails-every-minute'
)
order by jobname;
```

Ostatnie uruchomienia:

```sql
select jobid, status, return_message, start_time, end_time
from cron.job_run_details
order by start_time desc
limit 50;
```

### Wariant B: Scheduled Functions w Supabase Dashboard (manualny fallback)

1. Deploy funkcji `notification-digest-runner` i `send-emails`.
2. Utwórz harmonogram `notification-digest-runner` co 5-15 minut.
3. Dla `notification-digest-runner` ustaw nagłówek:

- `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`

4. Body dla `notification-digest-runner` zostaw puste.
5. Utwórz harmonogram `send-emails` co 1 minutę.
6. Dla `send-emails` ustaw nagłówek:

- `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`

7. Body dla `send-emails`:

```json
{ "limit": 25, "dry_run": false }
```

### Wariant C: ręczne `pg_cron` + `pg_net`

Wymagane rozszerzenia:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
```

Przykładowe schedulery:

```sql
select cron.schedule(
  'notification-digest-runner-every-10-minutes',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/notification-digest-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-function-secret', '<INTERNAL_FUNCTION_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'send-emails-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-function-secret', '<INTERNAL_FUNCTION_SECRET>'
    ),
    body := '{"limit":25,"dry_run":false}'::jsonb
  );
  $$
);
```

Uwaga: bezpieczniej trzymać sekrety w Supabase Vault i składać nagłówki z Vault.

Po skonfigurowaniu harmonogramów sprawdź logi Edge Functions:

- `notification-digest-runner` powinien zwracać `200` z polami `processed`, `enqueued`, `skipped`.
- `send-emails` powinien zwracać `200` z polami `fetched`, `sent`, `failed`, `dead`.

Jeśli `notification-digest-runner` działa, a emaile nie wychodzą, sprawdź
`public.email_outbox`: rekordy pozostające w `queued` zwykle oznaczają brak
działającego harmonogramu `send-emails`; rekordy `failed` albo `dead` powinny
mieć szczegóły w `last_error`.

## 5) Konfiguracja sekretów Edge Functions

Wymagane:

- `SUPABASE_SECRET_KEY`
- `INTERNAL_FUNCTION_SECRET`
- `EMAIL_FROM` (`no-reply@tickist.com`)
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Fallback tymczasowy podczas rolloutu:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ROUTINE_RUNNER_SECRET`

Opcjonalne:

- `AWS_SESSION_TOKEN`
- `SES_CONFIGURATION_SET`
- `EMAIL_RATE_LIMIT_PER_MINUTE` (domyślnie `1`)
- `EMAIL_RATE_LIMIT_PER_HOUR` (domyślnie `60`)
- `EMAIL_RATE_LIMIT_PER_DAY` (domyślnie `500`)

## 6) Bezpieczeństwo

- Nigdy nie commituj sekretów.
- `SUPABASE_SECRET_KEY` wyłącznie po stronie backend/cron.
- `INTERNAL_FUNCTION_SECRET` wyłącznie do wywołań wewnętrznych funkcji.
- Użytkownik końcowy nie ma bezpośredniego dostępu do `email_outbox`.
- Nie loguj treści emaili ani pełnych payloadów.
- Loguj tylko metryki, identyfikatory i kody błędów.

## 7) Koszty

Orientacyjnie AWS SES: około **$0.10 / 1000 emaili** (bez dodatkowych opłat transferowych/usług towarzyszących). Sprawdź aktualny cennik dla regionu.
