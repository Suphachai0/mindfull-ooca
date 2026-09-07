create type public.emotion as enum ('tired','gloomy','lonely','heavy','unsure','okay');
create type public.star_status as enum ('pending','approved','rejected','hidden');

create table public.stars (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 120 and length(btrim(content)) > 0),
  emotion public.emotion not null,
  source text not null default 'community' check (source in ('community','team')),
  status public.star_status not null default 'pending',
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index stars_pool on public.stars(emotion, status) where status = 'approved';
create index stars_author on public.stars(author_id, created_at desc);
create table public.saved_stars (
  user_id uuid references auth.users(id) on delete cascade not null,
  star_id uuid references public.stars(id) on delete cascade not null,
  saved_at timestamptz not null default now(),
  primary key(user_id,star_id)
);
create table public.moderators (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.stars(id) on delete cascade,
  reporter_key text not null,
  reason text not null check(reason in ('hurtful','personal','spam','other')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(message_id,reporter_key,reason)
);
create table public.moderation_log (
  id bigint generated always as identity primary key,
  message_id uuid not null references public.stars(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  status public.star_status not null,
  reason text not null check(char_length(reason) between 1 and 1000),
  created_at timestamptz not null default now()
);
create table public.submission_requests (
  request_id uuid primary key,
  author_id uuid,
  star_id uuid not null references public.stars(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.rate_limits (key text primary key, started_at timestamptz not null default now(), count integer not null default 1);

-- Public clients cannot read or write tables directly. Every operation is checked
-- by the Edge Function; only the server's service_role accesses these tables.
alter table public.stars enable row level security;
alter table public.saved_stars enable row level security;
alter table public.moderators enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_log enable row level security;
alter table public.submission_requests enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.stars,public.saved_stars,public.moderators,public.reports,public.moderation_log,public.submission_requests,public.rate_limits from anon,authenticated;
grant all on public.stars,public.saved_stars,public.moderators,public.reports,public.moderation_log,public.submission_requests,public.rate_limits to service_role;
grant usage,select on sequence public.moderation_log_id_seq to service_role;

create function public.consume_rate(p_key text, p_limit integer, p_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.rate_limits as r(key) values(p_key)
  on conflict(key) do update set
    count = case when r.started_at < now()-make_interval(secs=>p_seconds) then 1 else r.count+1 end,
    started_at = case when r.started_at < now()-make_interval(secs=>p_seconds) then now() else r.started_at end
  returning count into n;
  return n <= p_limit;
end; $$;

create function public.submit_star(p_content text,p_emotion public.emotion,p_author uuid,p_request uuid)
returns setof public.stars language plpgsql security definer set search_path='' as $$
declare existing public.stars; sid uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  select s.* into existing from public.submission_requests r join public.stars s on s.id=r.star_id where r.request_id=p_request;
  if found then
    if existing.author_id is distinct from p_author or existing.content<>p_content or existing.emotion<>p_emotion then
      raise exception 'REQUEST_CONFLICT';
    end if;
    return next existing; return;
  end if;
  insert into public.stars(content,emotion,author_id) values(p_content,p_emotion,p_author) returning id into sid;
  insert into public.submission_requests(request_id,author_id,star_id) values(p_request,p_author,sid);
  return query select * from public.stars where id=sid;
end; $$;

create function public.save_star(p_user uuid,p_star uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare added integer;
begin
  perform 1 from public.stars where id=p_star and status='approved' for share;
  if not found then raise exception 'STAR_UNAVAILABLE'; end if;
  insert into public.saved_stars(user_id,star_id) values(p_user,p_star) on conflict do nothing;
  get diagnostics added = row_count;
  return added > 0;
end; $$;

create function public.review_star(p_actor uuid,p_star uuid,p_status public.star_status,p_reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.moderators where user_id=p_actor) then raise exception 'FORBIDDEN'; end if;
  if p_status='pending' then raise exception 'INVALID_STATUS'; end if;
  update public.stars set status=p_status where id=p_star;
  if not found then raise exception 'STAR_UNAVAILABLE'; end if;
  insert into public.moderation_log(message_id,actor_id,status,reason) values(p_star,p_actor,p_status,p_reason);
  update public.reports set resolved_at=now() where message_id=p_star and resolved_at is null;
end; $$;

revoke all on function public.consume_rate(text,integer,integer),public.submit_star(text,public.emotion,uuid,uuid),public.save_star(uuid,uuid),public.review_star(uuid,uuid,public.star_status,text) from public,anon,authenticated;
grant execute on function public.consume_rate(text,integer,integer),public.submit_star(text,public.emotion,uuid,uuid),public.save_star(uuid,uuid),public.review_star(uuid,uuid,public.star_status,text) to service_role;
