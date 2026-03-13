# Email delivery (Supabase Auth + SES Outbox)

Ten dokument opisuje produkcyjne ustawienie wysyłki emaili w Tickist:

- **Supabase Auth** (reset hasła, magic link, potwierdzenie email): przez **SMTP AWS SES** skonfigurowany w Supabase Dashboard.
- **Notyfikacje aplikacyjne**: kolejka `public.email_outbox` + Edge Functions `enqueue-notification` i `send-emails` wysyłające przez **AWS SES API (SigV4)**.

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

## 2) Notyfikacje aplikacyjne (enqueue + batch sender)

Architektura:

1. Klient/user wywołuje `enqueue-notification`.
2. Funkcja waliduje JWT użytkownika i email confirmation.
3. Funkcja zapisuje rekord do `public.email_outbox` przez `public.enqueue_email(...)`.
4. Harmonogram wywołuje `send-emails` (co 1 minutę).
5. Worker pobiera batch, wysyła przez SES API, aktualizuje statusy i retry.

Zasady bezpieczeństwa:

- `enqueue-notification`:
  - wymaga JWT użytkownika,
  - nie akceptuje `to_email` w body (400),
  - bierze odbiorcę wyłącznie z `auth user` (JWT/`auth.admin.getUserById`),
  - wymaga potwierdzonego emaila (`email_confirmed_at`),
  - wymusza, aby `dedupe_key` zawierał `userId`.
- `send-emails`:
  - działa tylko z `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`.
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

## 4) Harmonogram `send-emails`

### Wariant A: Scheduled Functions w Supabase Dashboard

1. Deploy funkcji `send-emails`.
2. Utwórz harmonogram co 1 minutę.
3. Ustaw nagłówek:
- `x-internal-function-secret: <INTERNAL_FUNCTION_SECRET>`
4. Body:
```json
{ "limit": 25, "dry_run": false }
```

### Wariant B: `pg_cron` + `pg_net`

Wymagane rozszerzenia:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
```

Przykład schedulera co 1 minutę:

```sql
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
