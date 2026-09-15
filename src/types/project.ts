export type Project = {
  id: string;
  name: string;
  description: string | null;
  client_name: string | null;
  status: "active" | "completed" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ProjectWithStats = Project & {
  totalTasks: number;
  completedTasks: number;
};
export type ProjectTask = {
  id: string;
  status: "todo" | "in_progress" | "review" | "done";
};
