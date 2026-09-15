import {
  ArrowUpRight,
  Clock3,
  CircleAlert,
  CircleCheck,
  FolderKanban,
  ListChecks,
  Plus,
  Sparkles,
  Users,
  Loader2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getProjectCompletion,
  getRecentProjects,
  getTaskStatusCounts,
  getUpcomingDeadlines,
} from "../services/dashboardServices";
import { useNavigate } from "react-router-dom";
import { getRecentActivity } from "../services/activityServices";
import { dashboardQueryKeys } from "../utils/queryKeys";
import {
  generateSprintSummary,
  type SprintSummaryResponse,
} from "../services/aiServices";
import { useState } from "react";
import { getProjects, getProjectSprintData } from "../services/projectServices";

type Stat = {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
};

type Project = {
  initials: string;
  name: string;
  company: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  avatarClass: string;
};

// Activity Formatting

function formatActivity(activity: {
  action: string;
  entity_type: string;
  metadata: Record<string, unknown>;
}) {
  const title = activity.metadata?.title as string | undefined;
  const name = activity.metadata?.name as string | undefined;

  if (activity.entity_type === "project") {
    if (activity.action === "created") {
      return `created project "${name ?? "Unknown project"}"`;
    }

    if (activity.action === "updated") {
      return `updated project "${name ?? "Unknown project"}"`;
    }

    if (activity.action === "deleted") {
      return `deleted project "${name ?? "Unknown project"}"`;
    }
  }

  if (activity.entity_type === "task") {
    if (activity.action === "created") {
      return `created task "${title ?? "Unknown task"}"`;
    }

    if (activity.action === "updated") {
      return `updated task "${title ?? "Unknown task"}"`;
    }

    if (activity.action === "deleted") {
      return `deleted task "${title ?? "Unknown task"}"`;
    }

    if (activity.action === "status_changed") {
      const oldStatus = activity.metadata?.old_status as string | undefined;
      const newStatus = activity.metadata?.new_status as string | undefined;

      return `moved "${title ?? "Unknown task"}" from ${oldStatus ?? "unknown"} to ${newStatus ?? "unknown"}`;
    }
  }

  if (activity.entity_type === "comment") {
    if (activity.action === "commented") {
      return `commented on a task`;
    }

    if (activity.action === "updated") {
      return `updated a comment`;
    }

    if (activity.action === "deleted") {
      return `deleted a comment`;
    }
  }

  if (activity.entity_type === "project_member") {
    if (activity.action === "member_added") {
      return "added a member to a project";
    }

    if (activity.action === "member_removed") {
      return "removed a member from a project";
    }

    if (activity.action === "member_role_changed") {
      return "changed a project member's role";
    }
  }

  return "performed an action";
}

// Time formatter for activity

function formatActivityTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

const projectAvatarColors = [
  "bg-indigo-100 text-indigo-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-600",
];

function getProjectAvatarColor(projectId: string) {
  const hash = projectId
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return projectAvatarColors[hash % projectAvatarColors.length];
}

function formatDeadlineDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Dashboard() {
  const [isSprintSummaryOpen, setIsSprintSummaryOpen] = useState(false);
  const [sprintSummary, setSprintSummary] =
    useState<SprintSummaryResponse | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const navigate = useNavigate();
  const { data: dashboardStats } = useQuery({
    queryKey: dashboardQueryKeys.stats,
    queryFn: getDashboardStats,
  });

  const { data: taskStatusCounts } = useQuery({
    queryKey: dashboardQueryKeys.taskStatus,
    queryFn: getTaskStatusCounts,
  });

  /*
   * Summary cards
   */
  const stats: Stat[] = [
    {
      label: "Active projects",
      value: dashboardStats?.activeProjects ?? 0,
      description: `${dashboardStats?.totalProjects ?? 0} total`,
      icon: FolderKanban,
    },
    {
      label: "Total tasks",
      value: dashboardStats?.totalTasks ?? 0,
      description: "",
      icon: ListChecks,
    },
    {
      label: "Completed",
      value: dashboardStats?.completedTasks ?? 0,
      description:
        dashboardStats && dashboardStats.totalTasks > 0
          ? `${Math.round(
              (dashboardStats.completedTasks / dashboardStats.totalTasks) * 100,
            )}% done`
          : "0% done",
      icon: CircleCheck,
    },
    {
      label: "Overdue",
      value: dashboardStats?.overdueTasks ?? 0,
      description: "",
      icon: CircleAlert,
    },
    {
      label: "Team members",
      value: dashboardStats?.teamMembers ?? 0,
      description: "",
      icon: Users,
    },
  ];

  /*
   * Task status legend
   */
  const taskStatus = [
    {
      label: "In Review",
      value: taskStatusCounts?.review ?? 0,
      className: "bg-purple-500",
    },
    {
      label: "In Progress",
      value: taskStatusCounts?.in_progress ?? 0,
      className: "bg-indigo-500",
    },
    {
      label: "Completed",
      value: taskStatusCounts?.done ?? 0,
      className: "bg-emerald-500",
    },
    {
      label: "Todo",
      value: taskStatusCounts?.todo ?? 0,
      className: "bg-zinc-400",
    },
  ];

  /*
   * Total tasks for the donut center
   */
  const totalStatusTasks =
    (taskStatusCounts?.todo ?? 0) +
    (taskStatusCounts?.in_progress ?? 0) +
    (taskStatusCounts?.review ?? 0) +
    (taskStatusCounts?.done ?? 0);

  /*
   * Recharts data
   */
  const taskStatusChartData = [
    {
      name: "In Review",
      value: taskStatusCounts?.review ?? 0,
      color: "#a855f7",
    },
    {
      name: "In Progress",
      value: taskStatusCounts?.in_progress ?? 0,
      color: "#6366f1",
    },
    {
      name: "Completed",
      value: taskStatusCounts?.done ?? 0,
      color: "#10b981",
    },
    {
      name: "Todo",
      value: taskStatusCounts?.todo ?? 0,
      color: "#a1a1aa",
    },
  ];

  // Project Completion Value
  const { data: projectCompletion } = useQuery({
    queryKey: dashboardQueryKeys.projectCompletion,
    queryFn: getProjectCompletion,
  });

  const chartData =
    projectCompletion?.map((project) => ({
      name: project.name,
      value: project.completion,
    })) ?? [];

  // Get All Projects
  const { data: allProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  // Recent 6 projects
  const { data: recentProjects } = useQuery({
    queryKey: dashboardQueryKeys.recentProjects,
    queryFn: getRecentProjects,
  });

  // Get AI Sprint data

  const {
    data: selectedProjectTasks,
    isLoading: isLoadingProjectTasks,
    error: projectTasksError,
  } = useQuery({
    queryKey: ["project-sprint-data", selectedProjectId],
    queryFn: () => getProjectSprintData(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  // Upcomming deadlines

  const { data: upcomingDeadlines } = useQuery({
    queryKey: dashboardQueryKeys.upcomingDeadlines,
    queryFn: getUpcomingDeadlines,
  });

  // Activity Timeline

  const { data: recentActivity } = useQuery({
    queryKey: dashboardQueryKeys.recentActivities,
    queryFn: getRecentActivity,
  });

  async function handleSprintSummary() {
    if (!selectedProjectId) {
      return;
    }

    setIsGeneratingSummary(true);

    try {
      const projectTasks = selectedProjectTasks ?? [];
      const today = new Date();

      const sprintTasks = projectTasks.map(function (task) {
        const isOverdue =
          Boolean(task.due_date) &&
          new Date(task.due_date) < today &&
          task.status !== "done";

        return {
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date,
          assignee: task.profiles?.[0]?.full_name ?? "Unassigned",
          isOverdue,
        };
      });

      const result = await generateSprintSummary({
        totalTasks: projectTasks.length,

        completedTasks: projectTasks.filter(function (task) {
          return task.status === "done";
        }).length,

        inProgressTasks: projectTasks.filter(function (task) {
          return task.status === "in_progress";
        }).length,

        reviewTasks: projectTasks.filter(function (task) {
          return task.status === "review";
        }).length,

        todoTasks: projectTasks.filter(function (task) {
          return task.status === "todo";
        }).length,

        overdueTasks: sprintTasks.filter(function (task) {
          return task.isOverdue;
        }).length,

        tasks: sprintTasks,
      });

      setSprintSummary(result);
    } catch (error) {
      console.error("Sprint summary failed:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  return (
    <div className="min-h-full px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              onClick={() => navigate("/projects?create=true")}
            >
              <Plus size={14} />
              New project
            </button>

            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-white hover:bg-violet-700 cursor-pointer bg-linear-to-r from-indigo-600 to-purple-600 hover:brightness-110 transition-[filter]"
              onClick={() => setIsSprintSummaryOpen(true)}
            >
              <Sparkles size={14} />
              AI Sprint Summary
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                    <Icon size={15} strokeWidth={1.8} />
                  </div>

                  <ArrowUpRight size={14} className="text-slate-300" />
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>

                  {stat.description && (
                    <p className="mt-2 text-[10px] text-slate-400">
                      {stat.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          {/* Project completion */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Progress
              </p>

              <h2 className=" text-lg font-semibold text-slate-900">
                Project completion
              </h2>
            </div>

            <div className="mt-6 flex h-52">
              {/* Y axis */}
              <div className="flex w-8 flex-col justify-between pb-7 pt-1 text-[11px] text-slate-400">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Chart */}
              <div className="relative flex flex-1 items-end gap-3 border-b border-slate-100">
                <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-slate-100" />
                <div className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-slate-100" />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-slate-100" />
                <div className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-slate-100" />

                {chartData.map((item) => (
                  <div
                    key={item.name}
                    className="relative flex h-full flex-1 flex-col justify-end"
                  >
                    <div
                      className="relative z-10 w-full origin-bottom rounded-t-md bg-indigo-500 transition-opacity duration-200 hover:opacity-80"
                      style={{
                        height: `${item.value}%`,
                        animation: "growBar 800ms ease-out both",
                      }}
                    />

                    <span className="absolute -bottom-5 left-1/2 max-w-full -translate-x-1/2 truncate text-[11px] text-slate-400">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Breakdown
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Task status
            </h2>

            {/* Donut */}
            <div className="relative mt-5 h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={3}
                    stroke="white"
                    strokeWidth={2}
                  >
                    {taskStatusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center value */}
            </div>

            {/* Status counts */}
            <div className="mt-5 space-y-2">
              {taskStatus.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${item.className}`}
                    />

                    <span className="text-slate-500">{item.label}</span>
                  </div>

                  <span className="text-slate-500">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects + Deadlines */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          {/* Recent projects */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-slate-900">
                Recent projects
              </h2>

              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="text-[12px] font-medium text-violet-600 hover:text-violet-700 cursor-pointer
                hover:underline hover:underline-offset-1"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {(recentProjects ?? []).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-2.5 py-2"
                >
                  {/* Project avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${getProjectAvatarColor(
                      project.id,
                    )}`}
                  >
                    {project.name
                      .split(" ")
                      .map((word: string[]) => word[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  {/* Project information */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {project.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {project.client_name || ""}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="w-40 shrink-0">
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${project.progress}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-[9px] text-slate-400">
                      {project.progress}% • {project.completedTasks}/
                      {project.totalTasks} tasks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-display font-semibold tracking-tight text-slate-700">
              Upcoming deadlines
            </h2>

            <div className="mt-5 space-y-4">
              {(upcomingDeadlines ?? []).map((deadline) => (
                <div key={deadline.id} className="flex items-start gap-4">
                  <Clock3
                    size={18}
                    strokeWidth={1.8}
                    className="mt-1 shrink-0 text-slate-400"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6 text-slate-900">
                      {deadline.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDeadlineDate(deadline.due_date!)}
                    </p>
                  </div>
                </div>
              ))}

              {(upcomingDeadlines ?? []).length === 0 && (
                <p className="text-sm text-slate-400">No upcoming deadlines.</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Activity
          </h2>

          <div className="mt-3 space-y-5">
            {(recentActivity ?? []).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {/* Timeline dot */}
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />

                {/* Activity */}
                <div className="min-w-0">
                  <p className="text-sm font-normal leading-6 text-slate-900">
                    <span className="font-medium">
                      {activity.profiles?.full_name ?? "Unknown user"}
                    </span>{" "}
                    {formatActivity(activity)}
                  </p>

                  <p className="mt-0 text-[11px] text-slate-400">
                    {formatActivityTime(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {(recentActivity ?? []).length === 0 && (
              <p className="text-sm text-slate-400">No recent activity.</p>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 flex justify-end ${
          isSprintSummaryOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            isSprintSummaryOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSprintSummaryOpen(false)}
        />

        <div
          className={`relative h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-in-out overflow-hidden overflow-y-auto ${
            isSprintSummaryOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center text-purple-500 gap-2">
              <Sparkles size={15} />
              <h2 className="ai-gradient-text text-lg font-semibold text-slate-900">
                AI Sprint Summary
              </h2>

              {/* <p className="mt-1 text-sm text-slate-500">
                Select a project to generate an AI summary.
              </p> */}
            </div>

            <button
              type="button"
              onClick={() => setIsSprintSummaryOpen(false)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="p-4 pt-1">
            <label className="mb-2 block text-xs font-medium text-slate-700">
              Project
            </label>

            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">Select a project</option>

              {allProjects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSprintSummary}
              disabled={!selectedProjectId || isGeneratingSummary}
              className="flex items-center justify-center gap-2 mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {" "}
                  <Sparkles size={14} />
                  Generate Summary
                </>
              )}
            </button>
            {!sprintSummary && (
              <div className="text-xs mt-3 text-zinc-500 border border-dashed border-zinc-200 rounded-xl p-4">
                This will analyze the project's tasks and produce a professional
                summary including completed work, tasks needing attention, key
                risks, and recommended next steps.
              </div>
            )}
            {sprintSummary && (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                {/* <p className="whitespace-pre-wrap text-sm text-slate-700"></p> */}
                {sprintSummary && (
                  <div className="mt-6 space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Overall Status
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {sprintSummary.overallStatus}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        What’s Going Well
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                        {sprintSummary.goingWell.map(function (item, index) {
                          return <li key={index}>{item}</li>;
                        })}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Needs Attention
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                        {sprintSummary.needsAttention.map(
                          function (item, index) {
                            return <li key={index}>{item}</li>;
                          },
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Key Risks
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                        {sprintSummary.risks.map(function (item, index) {
                          return <li key={index}>{item}</li>;
                        })}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Recommended Actions
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                        {sprintSummary.nextActions.map(function (item, index) {
                          return <li key={index}>{item}</li>;
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
