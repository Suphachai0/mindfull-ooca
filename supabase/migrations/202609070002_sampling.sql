-- MVP's small reviewed pool: random selection happens in the database, not from
-- a truncated browser download. No author information leaves this function.
create function public.sample_stars(p_emotion public.emotion)
returns table(id uuid,content text,emotion public.emotion,source text,created_at timestamptz,status public.star_status)
language sql security definer set search_path='' as $$
  select id,content,emotion,source,created_at,status from public.stars
  where emotion=p_emotion and status='approved' order by random() limit 6;
$$;
revoke all on function public.sample_stars(public.emotion) from public,anon,authenticated;
grant execute on function public.sample_stars(public.emotion) to service_role;
