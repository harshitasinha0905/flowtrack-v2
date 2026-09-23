import { supabase } from "../lib/supabase";
import type { CreateTaskData, Task } from "../types/task";

export type GetTasksParams = {
  page: number;
  pageSize: number;
  search?: string;
  projectId?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  sortBy?: "due_date" | "priority";
};

export async function getTasks({
  page,
  pageSize,
  search = "",
  projectId,
  status,
  priority,
  sortBy = "due_date",
}: GetTasksParams): Promise<{
  tasks: Task[];
  totalCount: number;
}> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      projects(name),
      profiles!tasks_assigned_to_fkey (
        full_name
      )
    `,
      { count: "exact" },
    );

  // Search by task title
  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }

  // Project filter
  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  // Status filter
  if (status) {
    query = query.eq("status", status);
  }

  // Priority filter
  if (priority) {
    query = query.eq("priority", priority);
  }

  // Sorting
  if (sortBy === "priority") {
    query = query.order("priority", {
      ascending: false,
    });
  } else {
    query = query.order("due_date", {
      ascending: true,
      nullsFirst: false,
    });
  }

  // Secondary sort so ordering is stable
  query = query.order("created_at", {
    ascending: false,
  });

  // Fetch only the requested page
  const { data: tasks, count, error } = await query.range(from, to);

  if (error) {
    console.error("Get tasks error:", error);
    throw new Error("Task could not be loaded");
  }

  return {
    tasks: tasks ?? [],
    totalCount: count ?? 0,
  };
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
