-- Uses the same Vault configuration as existing notification workers.
select cron.schedule(
  'email-delivery-monitor-every-5-minutes', '*/5 * * * *',
  $cron$
  select net.http_post(
    url := (select rtrim(decrypted_secret, '/') from vault.decrypted_secrets
      where name = 'tickist_functions_base_url' limit 1) || '/email-delivery-monitor',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-internal-function-secret', (select decrypted_secret from vault.decrypted_secrets
        where name = 'tickist_internal_function_secret' limit 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);
