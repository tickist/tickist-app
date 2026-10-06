-- Administrator membership is provisioned by an operator, never by browser metadata.
create table public.app_administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_administrators enable row level security;
revoke all on public.app_administrators from public, anon, authenticated;
grant select on public.app_administrators to authenticated;
grant all on public.app_administrators to service_role;
create policy administrator_read_self on public.app_administrators
  for select to authenticated using (user_id = (select auth.uid()));

create function public.is_app_administrator()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.app_administrators where user_id = auth.uid());
$$;
revoke all on function public.is_app_administrator() from public, anon;
grant execute on function public.is_app_administrator() to authenticated;

create table public.email_delivery_health (
  id integer primary key default 1 check (id = 1),
  sample jsonb,
  checked_at timestamptz,
  attempted_at timestamptz not null default now(),
  target_limit integer not null check (target_limit > 0),
  monitor_available boolean not null,
  sns_configured boolean not null
);
create table public.email_monitor_alert_state (
  kind text primary key check (kind in ('usage_warning','usage_critical','quota_exhausted',
    'sending_disabled','monitor_unavailable','quota_mismatch','delivery_failure')),
  active boolean not null default false
);
create table public.email_monitor_alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null references public.email_monitor_alert_state(kind),
  sample jsonb,
  target_limit integer not null check (target_limit > 0),
  observed_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempt_count integer not null default 0,
  retry_at timestamptz not null default now(),
  claim_token uuid,
  lease_until timestamptz,
  published_at timestamptz
);
insert into public.email_monitor_alert_state(kind) values
  ('usage_warning'),('usage_critical'),('quota_exhausted'),('sending_disabled'),
  ('monitor_unavailable'),('quota_mismatch'),('delivery_failure');
create index email_monitor_alerts_pending on public.email_monitor_alerts(status, retry_at, observed_at);
create index email_monitor_alerts_history on public.email_monitor_alerts(observed_at desc);

alter table public.email_delivery_health enable row level security;
alter table public.email_monitor_alert_state enable row level security;
alter table public.email_monitor_alerts enable row level security;
revoke all on public.email_delivery_health, public.email_monitor_alert_state, public.email_monitor_alerts
  from public, anon, authenticated;
grant all on public.email_delivery_health, public.email_monitor_alert_state, public.email_monitor_alerts to service_role;
grant select on public.email_delivery_health, public.email_monitor_alerts to authenticated;
create policy health_administrator_read on public.email_delivery_health
  for select to authenticated using ((select public.is_app_administrator()));
create policy alerts_administrator_read on public.email_monitor_alerts
  for select to authenticated using ((select public.is_app_administrator()));

create function public.record_email_delivery_health(
  p_sample jsonb, p_target integer, p_issues text[], p_sns_configured boolean
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_issue record;
  v_active boolean;
  v_sample jsonb;
  v_failure boolean;
begin
  if p_target is null or p_target <= 0 or p_sns_configured is null or p_issues is null
    or exists (select 1 from unnest(p_issues) k where k not in (
      'usage_warning','usage_critical','quota_exhausted','sending_disabled',
      'monitor_unavailable','quota_mismatch')) then
    raise exception 'Invalid monitor sample' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('tickist.email-monitor', 0));
  if p_sample is not null then
    if jsonb_typeof(p_sample) <> 'object'
      or jsonb_typeof(p_sample->'sent_last_24h') is distinct from 'number'
      or jsonb_typeof(p_sample->'max_24h_send') is distinct from 'number'
      or jsonb_typeof(p_sample->'max_send_rate') is distinct from 'number'
      or jsonb_typeof(p_sample->'sending_enabled') is distinct from 'boolean'
      or jsonb_typeof(p_sample->'production_access_enabled') is distinct from 'boolean'
      or (p_sample->>'sent_last_24h')::numeric < 0
      or (p_sample->>'max_24h_send')::numeric < 0
      or (p_sample->>'max_send_rate')::numeric < 0
      or coalesce(p_sample->>'region','') !~ '^[a-z]{2}-[a-z]+-[0-9]$' then
      raise exception 'Invalid monitor sample' using errcode = '22023';
    end if;
    -- Store only aggregate operational data, never AWS account details or credentials.
    v_sample := jsonb_build_object(
      'region',p_sample->'region','sent_last_24h',p_sample->'sent_last_24h',
      'max_24h_send',p_sample->'max_24h_send','max_send_rate',p_sample->'max_send_rate',
      'sending_enabled',p_sample->'sending_enabled',
      'production_access_enabled',p_sample->'production_access_enabled');
  end if;
  insert into public.email_delivery_health(id, sample, checked_at, attempted_at,
    target_limit, monitor_available, sns_configured)
  values (1, v_sample, case when v_sample is not null then now() end, now(),
    p_target, v_sample is not null, p_sns_configured)
  on conflict(id) do update set
    sample = coalesce(excluded.sample, public.email_delivery_health.sample),
    checked_at = coalesce(excluded.checked_at, public.email_delivery_health.checked_at),
    attempted_at = now(), target_limit = p_target,
    monitor_available = excluded.monitor_available, sns_configured = p_sns_configured;

  select exists(
    select 1 from public.email_outbox
    where updated_at >= now() - interval '15 minutes'
      and (status in ('failed','dead') or
        (last_error ilike '%daily%quota%exceeded%' and status = 'queued'))
  ) into v_failure;

  for v_issue in select * from public.email_monitor_alert_state order by kind loop
    -- Failed reads must not reset an ongoing quota incident and generate repeat alerts.
    if v_sample is null and v_issue.kind not in ('monitor_unavailable','delivery_failure') then
      continue;
    end if;
    v_active := case when v_issue.kind = 'delivery_failure' then v_failure
      else v_issue.kind = any(p_issues) end;
    if v_active and not v_issue.active then
      -- If a polling interval jumps straight to 95% or exhaustion, send the highest usage alert only.
      if not (
        (v_issue.kind = 'usage_warning' and
          (array['usage_critical','quota_exhausted']::text[] && p_issues))
        or (v_issue.kind = 'usage_critical' and 'quota_exhausted' = any(p_issues))
      ) then
        insert into public.email_monitor_alerts(kind, sample, target_limit)
        values(v_issue.kind, v_sample, p_target);
      end if;
    end if;
    update public.email_monitor_alert_state set active = v_active where kind = v_issue.kind;
  end loop;
  delete from public.email_monitor_alerts
    where observed_at < now() - interval '30 days' and status in ('sent','failed');
end;
$$;

create function public.claim_email_monitor_alerts(p_worker uuid)
returns setof public.email_monitor_alerts language plpgsql security definer set search_path = ''
as $$
begin
  if p_worker is null then raise exception 'Worker required'; end if;
  return query
  with candidates as (
    select id from public.email_monitor_alerts
    where attempt_count < 5 and retry_at <= now()
      and (status = 'pending' or (status = 'sending' and lease_until < now()))
    order by observed_at for update skip locked limit 5
  )
  update public.email_monitor_alerts a
  set status = 'sending', claim_token = p_worker, lease_until = now() + interval '2 minutes',
    attempt_count = a.attempt_count + 1
  from candidates c where a.id = c.id returning a.*;
  -- An abandoned fifth attempt cannot remain permanently marked as sending.
  update public.email_monitor_alerts set status = 'failed', claim_token = null, lease_until = null
  where status = 'sending' and attempt_count >= 5 and lease_until < now();
end;
$$;

create function public.finish_email_monitor_alert(p_id uuid, p_worker uuid, p_accepted boolean)
returns void language sql security definer set search_path = ''
as $$
  update public.email_monitor_alerts set
    status = case when p_accepted then 'sent' when attempt_count >= 5 then 'failed' else 'pending' end,
    published_at = case when p_accepted then now() else null end,
    retry_at = now() + make_interval(mins => least(30, 5 * attempt_count)),
    claim_token = null, lease_until = null
  where id = p_id and status = 'sending' and claim_token = p_worker;
$$;

create function public.get_email_delivery_overview()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_app_administrator() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'health',(select to_jsonb(h) - 'id' from public.email_delivery_health h where id = 1),
    'outbox', (select jsonb_build_object(
      'queued',count(*) filter(where status='queued'),
      'sending',count(*) filter(where status='sending'),
      'failed',count(*) filter(where status in ('failed','dead')),
      'sent_last_24h',count(*) filter(where status='sent' and sent_at >= now() - interval '24 hours')
    ) from public.email_outbox),
    'alerts', coalesce((select jsonb_agg(to_jsonb(a) - 'claim_token' - 'lease_until' - 'sample')
      from (select * from public.email_monitor_alerts order by observed_at desc limit 20) a), '[]'::jsonb));
end;
$$;

revoke all on function public.record_email_delivery_health(jsonb,integer,text[],boolean),
  public.claim_email_monitor_alerts(uuid), public.finish_email_monitor_alert(uuid,uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.record_email_delivery_health(jsonb,integer,text[],boolean),
  public.claim_email_monitor_alerts(uuid), public.finish_email_monitor_alert(uuid,uuid,boolean)
  to service_role;
revoke all on function public.get_email_delivery_overview() from public, anon;
grant execute on function public.get_email_delivery_overview() to authenticated;
