create table public.keeper_requests (
  user_id uuid not null,
  request_id uuid not null,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  status text not null default 'pending' check (status in ('pending', 'complete')),
  reply jsonb,
  primary key (user_id, request_id),
  check ((status = 'pending' and reply is null) or (status = 'complete' and reply is not null)),
  check (reply is null or (jsonb_typeof(reply) = 'object' and octet_length(reply::text) <= 4096))
);
create index keeper_requests_created on public.keeper_requests (created_at);
create index keeper_requests_user_created on public.keeper_requests (user_id, created_at);
alter table public.keeper_requests enable row level security;
revoke all on public.keeper_requests from public, anon, authenticated, service_role;

create function public.reserve_keeper_request(p_user uuid, p_request uuid, p_fingerprint text, p_global_limit integer default 100)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  existing public.keeper_requests%rowtype;
  reservation_time timestamptz;
  day_start timestamptz;
begin
  if p_user is null or p_request is null or p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$'
    or p_global_limit is null or p_global_limit < 1 or p_global_limit > 100 then
    raise exception 'Invalid keeper reservation.' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(202610060001::bigint);
  reservation_time := pg_catalog.clock_timestamp();
  day_start := pg_catalog.date_trunc('day', reservation_time, 'UTC');
  select * into existing from public.keeper_requests where user_id = p_user and request_id = p_request;
  if found then
    if existing.fingerprint <> p_fingerprint then return pg_catalog.jsonb_build_object('kind', 'conflict'); end if;
    if existing.status = 'complete' then return pg_catalog.jsonb_build_object('kind', 'cached', 'reply', existing.reply); end if;
    return pg_catalog.jsonb_build_object('kind', 'pending');
  end if;
  if (select count(*) from public.keeper_requests where created_at >= day_start) >= p_global_limit
    or (select count(*) from public.keeper_requests where user_id = p_user and created_at >= day_start) >= 20
    or (select count(*) from public.keeper_requests where user_id = p_user and created_at >= reservation_time - interval '1 minute') >= 3 then
    return pg_catalog.jsonb_build_object('kind', 'denied');
  end if;
  insert into public.keeper_requests(user_id, request_id, fingerprint, created_at) values (p_user, p_request, p_fingerprint, reservation_time);
  return pg_catalog.jsonb_build_object('kind', 'new');
end;
$$;
revoke all on function public.reserve_keeper_request(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_keeper_request(uuid, uuid, text, integer) to service_role;

create function public.complete_keeper_request(p_user uuid, p_request uuid, p_fingerprint text, p_reply jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_reply is null or pg_catalog.jsonb_typeof(p_reply) <> 'object' or p_reply->>'mode' not in ('live', 'authored')
    or p_reply->>'mode' is null or pg_catalog.octet_length(p_reply::text) > 4096 then
    raise exception 'Invalid keeper reply.' using errcode = '22023';
  end if;
  update public.keeper_requests set status = 'complete', reply = p_reply
    where user_id = p_user and request_id = p_request and fingerprint = p_fingerprint and status = 'pending';
  return found;
end;
$$;
revoke all on function public.complete_keeper_request(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.complete_keeper_request(uuid, uuid, text, jsonb) to service_role;
