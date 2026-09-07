alter table public.moderation_log alter column actor_id drop not null;
alter table public.moderation_log add column actor_label text;
alter table public.moderation_log add constraint moderation_actor_present check (actor_id is not null or length(btrim(actor_label)) > 0);

create view public.dashboard_pending_messages with (security_invoker=true) as
select id, content, emotion, source, status, created_at
from public.stars where status='pending' order by created_at;
create view public.dashboard_open_reports with (security_invoker=true) as
select r.id report_id,r.message_id,r.reason,r.created_at,s.content,s.emotion,s.status
from public.reports r join public.stars s on s.id=r.message_id
where r.resolved_at is null order by r.created_at;
revoke all on public.dashboard_pending_messages,public.dashboard_open_reports from public,anon,authenticated,service_role;
grant select on public.dashboard_pending_messages,public.dashboard_open_reports to postgres;

create function public.dashboard_review_star(p_star uuid,p_status public.star_status,p_reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if current_user <> 'postgres' then raise exception 'FORBIDDEN'; end if;
  if p_status='pending' or length(btrim(p_reason))=0 or char_length(p_reason)>1000 then raise exception 'INVALID_REVIEW'; end if;
  update public.stars set status=p_status where id=p_star;
  if not found then raise exception 'STAR_UNAVAILABLE'; end if;
  insert into public.moderation_log(message_id,actor_label,status,reason) values(p_star,'Supabase Dashboard',p_status,btrim(p_reason));
  update public.reports set resolved_at=now() where message_id=p_star and resolved_at is null;
end; $$;
revoke all on function public.dashboard_review_star(uuid,public.star_status,text) from public,anon,authenticated,service_role;
grant execute on function public.dashboard_review_star(uuid,public.star_status,text) to postgres;

create function public.purge_ooca_expired() returns void
language plpgsql security definer set search_path='' as $$
begin
  delete from public.submission_requests where created_at < now()-interval '30 days';
  delete from public.stars where status in ('pending','rejected') and created_at < now()-interval '30 days';
  delete from public.reports where created_at < now()-interval '365 days';
  delete from public.moderation_log where created_at < now()-interval '365 days';
  delete from public.rate_limits where started_at < now()-interval '1 day';
end; $$;
revoke all on function public.purge_ooca_expired() from public,anon,authenticated,service_role;
grant execute on function public.purge_ooca_expired() to postgres;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('ooca-retention-daily','17 3 * * *','select public.purge_ooca_expired();');
