import { supabase } from "../lib/supabase";
import type { CreateTaskData, Task } from "../types/task";

export async function getTasks(): Promise<Task[]> {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      projects(name),
      profiles!tasks_assigned_to_fkey (
        full_name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Task could not be loaded");
  }

  return tasks;
}

export async function getTaskStats(projectId: string) {
  const [
    { count: totalTasks, error: totalTaskError },
    { count: completedTasks, error: completedTaskError },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId),

    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "done"),
  ]);

  if (totalTaskError || completedTaskError) {
    throw new Error("Task stats could not be loaded");
  }

  return {
    totalTasks: totalTasks ?? 0,
    completedTasks: completedTasks ?? 0,
  };
}

export async function getTasksByProject(projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      profiles:assigned_to (
        full_name
      )
    `,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Project tasks could not be loaded");
  }

  return data;
}

export async function createTask(task: CreateTaskData): Promise<Task> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a task");
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...task,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Create task error:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "created_at" | "updated_at">>,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateTaskStatus(
  taskId: string,
  status: Task["status"],
): Promise<Task> {
  const { data, error } = await supabase
    .rpc("update_task_status", {
      p_task_id: taskId,
      p_status: status,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    throw new Error("Task could not be deleted");
  }
}

export async function deleteTasks(taskIds: string[]) {
  const { error } = await supabase.from("tasks").delete().in("id", taskIds);
  if (error) {
    throw new Error("Tasks could not be deleted");
  }
}

export async function searchTasks(searchTerm: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      priority,
      project_id,
      projects (
        name
      )
    `)
    .ilike("title", `%${searchTerm}%`)
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
