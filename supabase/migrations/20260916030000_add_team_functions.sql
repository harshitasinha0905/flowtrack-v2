create or replace function public.get_team_members()
returns table (
  id uuid,
  full_name text,
  role text,
  email text
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    p.id,
    p.full_name,
    p.role,
    u.email
  from public.profiles p
  join auth.users u
    on u.id = p.id;
$function$;

grant all on function public.get_team_members() to anon;
grant all on function public.get_team_members() to authenticated;
grant all on function public.get_team_members() to service_role;


create or replace function public.get_team_member_stats()
returns table (
  id uuid,
  project_count bigint,
  task_count bigint,
  active_task_count bigint
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    p.id,

    (
      select count(distinct t.project_id)
      from public.tasks t
      where t.assigned_to = p.id
    ) as project_count,

    (
      select count(*)
      from public.tasks t
      where t.assigned_to = p.id
    ) as task_count,

    (
      select count(*)
      from public.tasks t
      where t.assigned_to = p.id
        and t.status <> 'done'
    ) as active_task_count

  from public.profiles p;
$function$;

grant all on function public.get_team_member_stats() to anon;
grant all on function public.get_team_member_stats() to authenticated;
grant all on function public.get_team_member_stats() to service_role;