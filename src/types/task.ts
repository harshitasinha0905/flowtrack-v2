export type Task = {
  id: string;
  project_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  created_at: string;
  updated_at: string;
  projects: {
    name: string;
  } | null;

  profiles: {
    full_name: string;
  } | null;
};

export type CreateTaskData = {
  project_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
};
