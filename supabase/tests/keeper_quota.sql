begin;
do $$
declare
  first_user uuid := '10000000-0000-4000-8000-000000000001';
  second_user uuid := '10000000-0000-4000-8000-000000000002';
  request_id uuid := '20000000-0000-4000-8000-000000000001';
  result jsonb;
  cached_reply jsonb := '{"mode":"authored","factId":"cell-observe","revision":0,"reason":"disabled"}';
begin
  result := public.reserve_keeper_request(first_user, request_id, repeat('a', 64));
  if result->>'kind' <> 'new' then raise exception 'First reservation failed'; end if;
  if public.reserve_keeper_request(first_user, request_id, repeat('a', 64))->>'kind' <> 'pending' then raise exception 'Duplicate did not remain pending'; end if;
  if public.reserve_keeper_request(first_user, request_id, repeat('b', 64))->>'kind' <> 'conflict' then raise exception 'Conflicting body accepted'; end if;
  if (select count(*) from public.keeper_requests) <> 1 then raise exception 'Duplicate consumed quota'; end if;
  if public.complete_keeper_request(second_user, request_id, repeat('a', 64), cached_reply) then raise exception 'Another user completed the request'; end if;
  if not public.complete_keeper_request(first_user, request_id, repeat('a', 64), cached_reply) then raise exception 'Owner could not complete'; end if;
  if public.reserve_keeper_request(first_user, request_id, repeat('a', 64))->'reply' <> cached_reply then raise exception 'Cached reply differs'; end if;
  if public.reserve_keeper_request(second_user, request_id, repeat('a', 64), 1)->>'kind' <> 'denied' then raise exception 'Global cap bypassed'; end if;
end;
$$;
set local role authenticated;
do $$
begin
  begin
    perform public.reserve_keeper_request('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', repeat('a', 64));
    raise exception 'Authenticated client executed privileged quota RPC';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.keeper_requests;
    raise exception 'Authenticated client read private request rows';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
do $$
declare
  user_id uuid := '30000000-0000-4000-8000-000000000001';
  id uuid;
  result jsonb;
begin
  for i in 1..4 loop
    id := ('40000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    result := public.reserve_keeper_request(user_id, id, repeat('c', 64));
    if i <= 3 and result->>'kind' <> 'new' then raise exception 'Allowed minute request denied'; end if;
    if i = 4 and result->>'kind' <> 'denied' then raise exception 'Minute cap bypassed'; end if;
  end loop;
  for i in 1..20 loop
    insert into public.keeper_requests(user_id, request_id, fingerprint, created_at)
    values ('50000000-0000-4000-8000-000000000001', ('60000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid, repeat('d', 64), clock_timestamp() - interval '2 minutes');
  end loop;
  if public.reserve_keeper_request('50000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', repeat('d', 64))->>'kind' <> 'denied' then raise exception 'Daily user cap bypassed'; end if;
end;
$$;
rollback;
