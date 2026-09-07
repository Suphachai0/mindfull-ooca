do $$
declare
  smoke_test record;
begin
  for smoke_test in
    select id
    from public.stars
    where source = 'community'
      and status = 'pending'
      and content = 'ข้อความทดสอบระบบก่อนเปิดใช้งาน'
  loop
    perform public.dashboard_review_star(
      smoke_test.id,
      'rejected',
      'Production smoke test; do not publish'
    );
  end loop;
end
$$;
