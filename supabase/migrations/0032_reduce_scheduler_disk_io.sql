-- Reduce scheduler disk IO. The per-minute workers call their Edge Functions
-- only when the database has work they can claim or recover, so idle minutes
-- no longer write pg_net responses or run PostgREST round trips. The gates are
-- supersets of the claim and stale-lock recovery conditions, so due work is
-- picked up on the same schedule as before.
do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname in (
      'task-reminder-runner-every-minute',
      'send-emails-every-minute',
      'purge-scheduler-observability-daily'
    )
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

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
  )
  where exists (
    select 1
    from public.task_reminders r
    where (r.status in ('scheduled', 'failed') and r.remind_at <= now())
      or r.status = 'processing'
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
  )
  where exists (
    select 1
    from public.email_outbox e
    where (e.status = 'queued' and (e.retry_at is null or e.retry_at <= now()))
      or e.status = 'sending'
  );
  $cron$
);

-- One day of run history is enough for diagnostics and keeps the frequently
-- written scheduler tables small. pg_net already expires responses after its
-- own TTL; the explicit cleanup remains as a safety net.
select cron.schedule(
  'purge-scheduler-observability-daily',
  '17 3 * * *',
  $cron$
  delete from cron.job_run_details
  where end_time < now() - interval '1 day';

  delete from net._http_response
  where created < now() - interval '24 hours';
  $cron$
);
