create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  action text not null,

  entity_type text not null,

  entity_id uuid,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index activity_logs_created_at_idx
  on public.activity_logs(created_at desc);

create index activity_logs_user_id_idx
  on public.activity_logs(user_id);

create index activity_logs_entity_idx
  on public.activity_logs(entity_type, entity_id);

  alter table public.activity_logs enable row level security;

create policy "Authenticated users can view activity"
on public.activity_logs
for select
to authenticated
using (true);

create policy "Users can create their own activity"
on public.activity_logs
for insert
to authenticated
with check (user_id = auth.uid());

create or replace function public.log_activity(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  insert into public.activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  );
end;
$function$;

create or replace function public.log_project_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    new.created_by,
    'created',
    'project',
    new.id,
    jsonb_build_object(
      'name', new.name
    )
  );

  return new;
end;
$function$;

create trigger on_project_created
after insert on public.projects
for each row
execute function public.log_project_created();

create or replace function public.log_task_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    new.created_by,
    'created',
    'task',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'project_id', new.project_id,
      'assigned_to', new.assigned_to
    )
  );

  return new;
end;
$function$;

create trigger on_task_created
after insert on public.tasks
for each row
execute function public.log_task_created();

create or replace function public.log_task_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  -- Only log when the status actually changes
  if old.status is distinct from new.status then
    perform public.log_activity(
      auth.uid(),
      'status_changed',
      'task',
      new.id,
      jsonb_build_object(
        'title', new.title,
        'old_status', old.status,
        'new_status', new.status
      )
    );
  end if;

  return new;
end;
$function$;
create trigger on_task_status_changed
after update of status on public.tasks
for each row
execute function public.log_task_status_changed();

create or replace function public.log_task_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  -- Status changes are handled by the dedicated status trigger.
  if old.title is distinct from new.title
     or old.description is distinct from new.description
     or old.priority is distinct from new.priority
     or old.due_date is distinct from new.due_date
     or old.assigned_to is distinct from new.assigned_to then

    perform public.log_activity(
      auth.uid(),
      'updated',
      'task',
      new.id,
      jsonb_build_object(
        'title', new.title
      )
    );
  end if;

  return new;
end;
$function$;

create trigger on_task_updated
after update on public.tasks
for each row
execute function public.log_task_updated();

create or replace function public.log_task_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    auth.uid(),
    'deleted',
    'task',
    old.id,
    jsonb_build_object(
      'title', old.title
    )
  );

  return old;
end;
$function$;

create trigger on_task_deleted
after delete on public.tasks
for each row
execute function public.log_task_deleted();

create or replace function public.log_project_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if old.name is distinct from new.name
     or old.description is distinct from new.description
     or old.status is distinct from new.status then

    perform public.log_activity(
      auth.uid(),
      'updated',
      'project',
      new.id,
      jsonb_build_object(
        'name', new.name
      )
    );
  end if;

  return new;
end;
$function$;

create trigger on_project_updated
after update on public.projects
for each row
execute function public.log_project_updated();

create or replace function public.log_project_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    auth.uid(),
    'deleted',
    'project',
    old.id,
    jsonb_build_object(
      'name', old.name
    )
  );

  return old;
end;
$function$;

create trigger on_project_deleted
after delete on public.projects
for each row
execute function public.log_project_deleted();

create or replace function public.log_comment_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    new.profile_id,
    'commented',
    'comment',
    new.id,
    jsonb_build_object(
      'task_id', new.task_id,
      'content', new.content
    )
  );

  return new;
end;
$function$;

create trigger on_comment_created
after insert on public.comments
for each row
execute function public.log_comment_created();

create or replace function public.log_comment_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if old.content is distinct from new.content then
    perform public.log_activity(
      new.profile_id,
      'updated',
      'comment',
      new.id,
      jsonb_build_object(
        'task_id', new.task_id
      )
    );
  end if;

  return new;
end;
$function$;

create trigger on_comment_updated
after update on public.comments
for each row
execute function public.log_comment_updated();

create or replace function public.log_comment_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    old.profile_id,
    'deleted',
    'comment',
    old.id,
    jsonb_build_object(
      'task_id', old.task_id
    )
  );

  return old;
end;
$function$;

create trigger on_comment_deleted
after delete on public.comments
for each row
execute function public.log_comment_deleted();

create or replace function public.log_project_member_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    auth.uid(),
    'member_added',
    'project_member',
    new.project_id,
    jsonb_build_object(
      'profile_id', new.profile_id,
      'role', new.role
    )
  );

  return new;
end;
$function$;

create trigger on_project_member_added
after insert on public.project_members
for each row
execute function public.log_project_member_added();

create or replace function public.log_project_member_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform public.log_activity(
    auth.uid(),
    'member_removed',
    'project_member',
    old.project_id,
    jsonb_build_object(
      'profile_id', old.profile_id,
      'role', old.role
    )
  );

  return old;
end;
$function$;

create trigger on_project_member_removed
after delete on public.project_members
for each row
execute function public.log_project_member_removed();

create or replace function public.log_project_member_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if old.role is distinct from new.role then
    perform public.log_activity(
      auth.uid(),
      'member_role_changed',
      'project_member',
      new.project_id,
      jsonb_build_object(
        'profile_id', new.profile_id,
        'old_role', old.role,
        'new_role', new.role
      )
    );
  end if;

  return new;
end;
$function$;

create trigger on_project_member_updated
after update on public.project_members
for each row
execute function public.log_project_member_updated();