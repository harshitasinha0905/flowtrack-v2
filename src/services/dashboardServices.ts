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

export async function getTaskStatusCounts() {
  const { data, error } = await supabase.from("tasks").select("status");

  if (error) {
    throw new Error("Task status counts could not be loaded");
  }

  return {
    todo: data.filter((task) => task.status === "todo").length,
    in_progress: data.filter((task) => task.status === "in_progress").length,
    review: data.filter((task) => task.status === "review").length,
    done: data.filter((task) => task.status === "done").length,
  };
}

export async function getProjectCompletion() {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      tasks (
        id,
        status
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Project completion could not be loaded");
  }

  return data.map((project) => {
    const totalTasks = project.tasks?.length ?? 0;

    const completedTasks =
      project.tasks?.filter((task) => task.status === "done").length ?? 0;

    const completion =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      completion,
    };
  });
}

export async function getRecentProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      description,
      client_name,
      status,
      created_at,
      tasks (
        id,
        status
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error("Recent projects could not be loaded");
  }

  return data.map((project) => {
    const totalTasks = project.tasks?.length ?? 0;

    const completedTasks =
      project.tasks?.filter((task) => task.status === "done").length ?? 0;

    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      client_name: project.client_name,
      status: project.status,
      progress,
      completedTasks,
      totalTasks,
    };
  });
}

export async function getUpcomingDeadlines() {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      due_date,
      projects(name)
    `,
    )
    .not("due_date", "is", null)
    .gte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(6);

  if (error) {
    throw new Error("Upcoming deadlines could not be loaded");
  }

  return data;
}
