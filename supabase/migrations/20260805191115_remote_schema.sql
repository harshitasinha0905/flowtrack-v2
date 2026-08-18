-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION IF EXISTS pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public.project_status AS ENUM (
  'active',
  'completed',
  'archived'
);

CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE public.task_status AS ENUM (
  'todo',
  'in_progress',
  'review',
  'done'
);

CREATE TYPE public.user_role AS ENUM (
  'member',
  'manager',
  'admin'
);

CREATE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;

GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;

GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;

CREATE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;

CREATE TABLE public.comments (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  task_id    uuid                     NOT NULL,
  profile_id uuid,
  content    text                     NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.comments
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_pkey PRIMARY KEY (id);

GRANT ALL ON public.comments TO anon;

GRANT ALL ON public.comments TO authenticated;

GRANT ALL ON public.comments TO service_role;

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.profiles (
  id         uuid                     NOT NULL,
  full_name  text,
  avatar_url text,
  role       public.user_role         DEFAULT 'member'::public.user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.comments
  ADD CONSTRAINT comments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

GRANT ALL ON public.profiles TO anon;

GRANT ALL ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = id));

CREATE TABLE public.project_members (
  project_id uuid                     NOT NULL,
  profile_id uuid                     NOT NULL,
  role       public.user_role         DEFAULT 'member'::public.user_role NOT NULL,
  joined_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.project_members
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_pkey PRIMARY KEY (project_id, profile_id);

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

GRANT ALL ON public.project_members TO anon;

GRANT ALL ON public.project_members TO authenticated;

GRANT ALL ON public.project_members TO service_role;

CREATE TABLE public.projects (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  name        text                     NOT NULL,
  description text,
  status      public.project_status    DEFAULT 'active'::public.project_status NOT NULL,
  created_by  uuid                     NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.projects
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

GRANT ALL ON public.projects TO anon;

GRANT ALL ON public.projects TO authenticated;

GRANT ALL ON public.projects TO service_role;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tasks (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  project_id  uuid                     NOT NULL,
  assigned_to uuid,
  title       text                     NOT NULL,
  description text,
  status      public.task_status       DEFAULT 'todo'::public.task_status NOT NULL,
  priority    public.task_priority     DEFAULT 'medium'::public.task_priority NOT NULL,
  due_date    date,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.tasks
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

ALTER TABLE public.comments
  ADD CONSTRAINT comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

GRANT ALL ON public.tasks TO anon;

GRANT ALL ON public.tasks TO authenticated;

GRANT ALL ON public.tasks TO service_role;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
