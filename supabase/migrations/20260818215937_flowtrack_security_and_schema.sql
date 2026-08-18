set local check_function_bodies = off;

drop policy "Users can view their own profile" on "public"."profiles";

alter table "public"."tasks"
  add column "created_by" uuid;

create or replace function public.update_task_status (
  p_task_id uuid,
  p_status  public.task_status
)
  returns public.tasks
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
DECLARE
  updated_task public.tasks;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.tasks t
    WHERE t.id = p_task_id
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
      )
  ) THEN
    RAISE EXCEPTION 'You do not have permission to change this task status';
  END IF;

  UPDATE public.tasks
  SET status = p_status
  WHERE id = p_task_id
  RETURNING * INTO updated_task;

  RETURN updated_task;
END;
$function$;

alter table "public"."tasks"
  add constraint "tasks_created_by_fkey" foreign key (created_by) references public.profiles(id) on delete cascade;

create policy "Authenticated users can view comments" on "public"."comments"
  for select
  to "authenticated"
  using (true);

create policy "Users can create comments" on "public"."comments"
  for insert
  to "authenticated"
  with check ((profile_id = auth.uid()));

create policy "Users can delete their own comments" on "public"."comments"
  for delete
  to "authenticated"
  using ((profile_id = auth.uid()));

create policy "Users can update their own comments" on "public"."comments"
  for update
  to "authenticated"
  using ((profile_id = auth.uid()))
  with check ((profile_id = auth.uid()));

create policy "Authenticated users can view all profiles" on "public"."profiles"
  for select
  to "authenticated"
  using (true);

create policy "Authenticated users can view project members" on "public"."project_members"
  for select
  to "authenticated"
  using (true);

create policy "Project creators and admins can add members" on "public"."project_members"
  for insert
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = project_members.project_id) AND ((p.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))))))));

create policy "Project creators and admins can remove members" on "public"."project_members"
  for delete
  to "authenticated"
  using ((exists ( select 1
   from public.projects p
  where ((p.id = project_members.project_id) AND ((p.created_by = auth.uid()) or (exists ( select 1
           from public.profiles
          where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))))))));

create policy "Project creators and admins can update members" on "public"."project_members"
  for update
  to "authenticated"
  using ((exists ( select 1
   from public.projects p
  where ((p.id = project_members.project_id) AND ((p.created_by = auth.uid()) or (exists ( select 1
           from public.profiles
          where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))))))))
  with check ((EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = project_members.project_id) AND ((p.created_by = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))))))));

create policy "Authenticated users can view projects" on "public"."projects"
  for select
  to "authenticated"
  using (true);

create policy "Creators and admins can delete projects" on "public"."projects"
  for delete
  to "authenticated"
  using (((auth.uid() = created_by) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));

create policy "Creators and admins can update projects" on "public"."projects"
  for update
  to "authenticated"
  using (((auth.uid() = created_by) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))))
  with check (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));

create policy "Users can create projects" on "public"."projects"
  for insert
  to "authenticated"
  with check ((auth.uid() = created_by));

create policy "Admins and creators can delete tasks" on "public"."tasks"
  for delete
  to "authenticated"
  using (((auth.uid() = created_by) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));

create policy "Admins and creators can update tasks" on "public"."tasks"
  for update
  to "authenticated"
  using (((auth.uid() = created_by) or (exists ( select 1
   from public.profiles
  where ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))))
  with check (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role))))));

create policy "Authenticated users can view tasks" on "public"."tasks"
  for select
  to "authenticated"
  using (true);

create policy "Users can create tasks" on "public"."tasks"
  for insert
  to "authenticated"
  with check ((auth.uid() = created_by));

grant execute on function "public"."update_task_status"(uuid, public.task_status) to public, "anon", "authenticated", "postgres", "service_role";
