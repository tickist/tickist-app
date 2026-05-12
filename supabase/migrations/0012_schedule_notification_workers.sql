create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname in (
      'notification-digest-runner-every-10-minutes',
      'task-reminder-runner-every-minute',
      'send-emails-every-minute'
    )
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'notification-digest-runner-every-10-minutes',
  '*/10 * * * *',
  $cron$
  select net.http_post(
    url := (
      select rtrim(decrypted_secret, '/')
      from vault.decrypted_secrets
      where name = 'tickist_functions_base_url'
      limit 1
    ) || '/notification-digest-runner',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'x-internal-function-secret',
      (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'tickist_internal_function_secret'
        limit 1
      )
    ),
    body := '{}'::jsonb
  );
  $cron$
);

select cron.schedule(
  'task-reminder-runner-every-minute',
  '* * * * *',
  $cron$
  select net.http_post(
    url := (
      select rtrim(decrypted_secret, '/')
      from vault.decrypted_secrets
      where name = 'tickist_functions_base_url'
      limit 1
    ) || '/task-reminder-runner',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'x-internal-function-secret',
      (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'tickist_internal_function_secret'
        limit 1
      )
    ),
    body := '{"limit":25}'::jsonb
  );
  $cron$
);

select cron.schedule(
  'send-emails-every-minute',
  '* * * * *',
  $cron$
  select net.http_post(
    url := (
      select rtrim(decrypted_secret, '/')
      from vault.decrypted_secrets
      where name = 'tickist_functions_base_url'
      limit 1
    ) || '/send-emails',
    headers := jsonb_build_object(
      'Content-Type',
      'application/json',
      'x-internal-function-secret',
      (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'tickist_internal_function_secret'
        limit 1
      )
    ),
    body := '{"limit":25,"dry_run":false}'::jsonb
  );
  $cron$
);
