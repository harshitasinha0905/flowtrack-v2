import { supabase } from "../lib/supabase";

type SprintTask = {
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: string;
  isOverdue: boolean;
};

type SprintData = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  todoTasks: number;
  overdueTasks: number;
  tasks: SprintTask[];
};

export type SprintSummaryResponse = {
  overallStatus: string;
  goingWell: string[];
  needsAttention: string[];
  risks: string[];
  nextActions: string[];
};

export async function generateSprintSummary(
  sprintData: SprintData,
): Promise<SprintSummaryResponse> {
  const { data, error } = await supabase.functions.invoke(
    "generate-sprint-summary",
    {
      body: {
        sprintData,
      },
    },
  );

   console.log("Sprint tasks data:", data);
  console.log("Sprint tasks error:", error);

  if (error) {
    // throw new Error(error.message || "Failed to generate sprint summary");
     throw new Error(error.message);
  }

  return data;
}