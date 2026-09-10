-- Keep scheduler diagnostics bounded without affecting scheduled jobs or app data.
do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname = 'purge-scheduler-observability-daily'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'purge-scheduler-observability-daily',
  '17 3 * * *',
  $cron$
  delete from cron.job_run_details
  where end_time < now() - interval '7 days';

  delete from net._http_response
  where created < now() - interval '24 hours';
  $cron$
);
