import { supabase } from "../lib/supabase";

export async function getDashboardStats() {
  const [
    { count: totalProjects, error: projectsError },
    { count: activeProjects, error: activeProjectsError },
    { count: totalTasks, error: tasksError },
    { count: completedTasks, error: completedTasksError },
    { count: overdueTasks, error: overdueTasksError },
    { count: teamMembers, error: profilesError },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    supabase.from("tasks").select("*", { count: "exact", head: true }),

    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "done"),

    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .lt("due_date", new Date().toISOString().split("T")[0])
      .neq("status", "done"),

    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  if (
    projectsError ||
    activeProjectsError ||
    tasksError ||
    completedTasksError ||
    overdueTasksError ||
    profilesError
  ) {
    throw new Error("Dashboard statistics could not be loaded");
  }

  return {
    totalProjects: totalProjects ?? 0,
    activeProjects: activeProjects ?? 0,
    totalTasks: totalTasks ?? 0,
    completedTasks: completedTasks ?? 0,
    overdueTasks: overdueTasks ?? 0,
    teamMembers: teamMembers ?? 0,
  };
}
