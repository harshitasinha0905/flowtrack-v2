export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
};
