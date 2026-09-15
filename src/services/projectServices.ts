import { supabase } from "../lib/supabase";
import type { Project, ProjectTask, ProjectWithStats } from "../types/project";

export async function getProjects(): Promise<ProjectWithStats[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
      tasks(
      id, 
      status
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Projects could not be loaded");
  }

  return data.map((project) => {
    const totalTasks = project.tasks?.length ?? 0;
    const completedTasks =
      project.tasks.filter((task: ProjectTask) => task.status === "done")
        .length ?? 0;
    return {
      ...project,
      totalTasks,
      completedTasks,
    };
  });
}

export async function getProjectById(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw new Error("Project could not be loaded");
  }

  return data;
}

export async function createProject(
  project: Omit<Project, "id" | "created_at" | "updated_at" | "created_by">,
): Promise<Project> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a project");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...project,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Project could not be created");
  }
  return data;
}

export async function updateProject(
  id: string,
  project: {
    name: string;
    description: string;
    status: "active" | "completed" | "archived";
  },
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(project)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Project could not be updated");
  }

  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw new Error("Project could not be deleted");
  }
}

export async function getProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
      *,
      profiles (
        id,
        full_name,
        avatar_url,
        role
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) {
    throw new Error("Project members could not be loaded");
  }

  return data;
}

export async function getProjectSprintData(projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      assigned_to,
      profiles!tasks_assigned_to_fkey (
        full_name
      )
    `)
    .eq("project_id", projectId);

    console.log("Sprint tasks data:", data);
    console.log("Sprint tasks error:", error);

    if (error) {
      throw new Error(error.message);
    }

  return data;
}

// export async function getTeamMemberStats() {
//   const { data, error } = await supabase
//     .from("profiles")
//     .select(`
//       id,
//       full_name,
//       role,
//       project_members (
//         project_id
//       ),
//       tasks!tasks_assigned_to_fkey (
//         id,
//         status
//       )
//     `);

//   if (error) {
//     console.error("Team member stats error:", error);
//     throw new Error(error.message);
//   }

//   return data;
// }

export async function getTeamMembers() {
  const { data, error } = await supabase.rpc("get_team_members");

  if (error) {
    console.error("Team member stats error:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function getTeamMemberStats() {
  const { data, error } = await supabase.rpc("get_team_member_stats");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function searchProjects(searchTerm: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, client_name, status")
    .ilike("name", `%${searchTerm}%`)
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}