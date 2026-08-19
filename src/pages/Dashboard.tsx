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

// Temporary hardcoded data.
// We will make this dynamic later.
const deadlines = [
  {
    title: "Design onboarding wireframes",
    date: "Jul 31",
  },
  {
    title: "Set up feature flags",
    date: "Jul 31",
  },
  {
    title: "Setup CI/CD pipelines",
    date: "Aug 1",
  },
  {
    title: "Write RFC: search revamp",
    date: "Aug 1",
  },
  {
    title: "Instrument error monitoring",
    date: "Aug 2",
  },
  {
    title: "Redesign settings page",
    date: "Aug 3",
  },
];

// Temporary hardcoded data.
// We will replace this with real activity later.
const activities = [
  {
    text: "moved 'Prepare launch checklist' to completed",
    date: "7 days ago",
  },
  {
    text: "moved 'Write RFC: search revamp' to in_progress",
    date: "7 days ago",
  },
  {
    text: "moved 'Update dependencies' to todo",
    date: "7 days ago",
  },
  {
    text: "moved 'Write onboarding docs' to in_progress",
    date: "7 days ago",
  },
  {
    text: "commented on 'Design onboarding wireframes'",
    date: "7 days ago",
  },
  {
    text: "created project TEST_UI_137276",
    date: "7 days ago",
  },
  {
    text: "created project TEST_Project",
    date: "7 days ago",
  },
  {
    text: "moved 'TEST_Task_notif' to in_progress",
    date: "7 days ago",
  },
];

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
  const navigate = useNavigate();
  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const { data: taskStatusCounts } = useQuery({
    queryKey: ["dashboard-task-status"],
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
    queryKey: ["dashboard-project-completion"],
    queryFn: getProjectCompletion,
  });

  const chartData =
    projectCompletion?.map((project) => ({
      name: project.name,
      value: project.completion,
    })) ?? [];

  // Recent 6 projects
  const { data: recentProjects } = useQuery({
    queryKey: ["dashboard-recent-projects"],
    queryFn: getRecentProjects,
  });

  // Upcomming deadlines

  const { data: upcomingDeadlines } = useQuery({
    queryKey: ["dashboard-upcomming-deadlines"],
    queryFn: getUpcomingDeadlines,
  });

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
              className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white transition hover:bg-violet-700"
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
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Progress
              </p>

              <h2 className="mt-1 text-sm font-medium text-slate-900">
                Project completion
              </h2>
            </div>

            <div className="mt-6 flex h-52">
              {/* Y axis */}
              <div className="flex w-8 flex-col justify-between pb-7 pt-1 text-[10px] text-slate-400">
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

                    <span className="absolute -bottom-5 left-1/2 max-w-full -translate-x-1/2 truncate text-[9px] text-slate-400">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Breakdown
            </p>

            <h2 className="mt-1 text-sm font-medium text-slate-900">
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
                  className="flex items-center justify-between text-[10px]"
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
              <h2 className="text-sm font-medium text-slate-900">
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
                    <p className="truncate text-[11px] font-semibold text-slate-900">
                      {project.name}
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-slate-500">
                      {project.description || "No description"}
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
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-medium text-slate-900">Activity</h2>

          <div className="mt-4 space-y-3">
            {activities.map((activity, index) => (
              <div key={`${activity.text}-${index}`} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />

                <div>
                  <p className="text-[11px] text-slate-700">{activity.text}</p>

                  <p className="mt-0.5 text-[9px] text-slate-400">
                    {activity.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
