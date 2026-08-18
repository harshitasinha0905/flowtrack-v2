import { supabase } from "../lib/supabase";
import type { Project } from "../types/project";

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Projects could not be loaded");
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
