import { dashboardQueryKeys } from "./queryKeys";
import type { QueryClient } from "@tanstack/react-query";

export function invalidateTaskRelatedQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    queryKey: dashboardQueryKeys.stats,
  });

  queryClient.invalidateQueries({
    queryKey: dashboardQueryKeys.projectCompletion,
  });

  queryClient.invalidateQueries({
    queryKey: dashboardQueryKeys.recentProjects,
  });

  queryClient.invalidateQueries({
    queryKey: dashboardQueryKeys.recentActivities,
  });
  queryClient.invalidateQueries({
    queryKey: ["tasks"],
  });
  queryClient.invalidateQueries({
    queryKey: ["project-tasks"],
  });

  queryClient.invalidateQueries({
    queryKey: ["project-task-stats"],
  });
  queryClient.invalidateQueries({
    queryKey: ["projects"],
  });
}
