import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Clock3,
  FolderKanban,
  ListChecks,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

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

const stats: Stat[] = [
  {
    label: "Active projects",
    value: 6,
    description: "8 total",
    icon: FolderKanban,
  },
  {
    label: "Total tasks",
    value: 53,
    description: "",
    icon: ListChecks,
  },
  {
    label: "Completed",
    value: 11,
    description: "21% done",
    icon: CircleCheck,
  },
  {
    label: "Overdue",
    value: 20,
    description: "",
    icon: CircleAlert,
  },
  {
    label: "Team members",
    value: 10,
    description: "",
    icon: Users,
  },
];

const projects: Project[] = [
  {
    initials: "AW",
    name: "Aurora Web Platform",
    company: "Northwind Labs",
    progress: 0,
    completedTasks: 0,
    totalTasks: 7,
    avatarClass: "bg-indigo-100 text-indigo-600",
  },
  {
    initials: "KM",
    name: "Kepler Mobile App",
    company: "Stellar Motors",
    progress: 0,
    completedTasks: 0,
    totalTasks: 7,
    avatarClass: "bg-purple-100 text-purple-600",
  },
  {
    initials: "HD",
    name: "Helix Design System",
    company: "Internal",
    progress: 33,
    completedTasks: 2,
    totalTasks: 6,
    avatarClass: "bg-emerald-100 text-emerald-600",
  },
  {
    initials: "VA",
    name: "Vertex Analytics",
    company: "Delta Retail",
    progress: 14,
    completedTasks: 1,
    totalTasks: 7,
    avatarClass: "bg-amber-100 text-amber-600",
  },
  {
    initials: "OA",
    name: "Orion API Gateway",
    company: "Nimbus Cloud",
    progress: 14,
    completedTasks: 1,
    totalTasks: 7,
    avatarClass: "bg-rose-100 text-rose-600",
  },
  {
    initials: "MM",
    name: "Meridian Marketing Site",
    company: "Bright & Co.",
    progress: 57,
    completedTasks: 4,
    totalTasks: 7,
    avatarClass: "bg-sky-100 text-sky-600",
  },
  {
    initials: "NA",
    name: "Nova Analytics",
    company: "Internal",
    progress: 36,
    completedTasks: 3,
    totalTasks: 8,
    avatarClass: "bg-blue-100 text-blue-600",
  },
  {
    initials: "AT",
    name: "Atlas Platform",
    company: "Northwind Labs",
    progress: 20,
    completedTasks: 2,
    totalTasks: 10,
    avatarClass: "bg-orange-100 text-orange-600",
  },
];

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

const chartData = [
  { name: "Aurora", value: 0 },
  { name: "Kepler", value: 0 },
  { name: "Helix", value: 32 },
  { name: "Vertex", value: 14 },
  { name: "Orion", value: 14 },
  { name: "Meridian", value: 57 },
  { name: "Nova", value: 32 },
  { name: "Atlas", value: 17 },
];

const taskStatus = [
  {
    label: "In Review",
    value: 9,
    className: "bg-violet-500",
  },
  {
    label: "In Progress",
    value: 15,
    className: "bg-indigo-500",
  },
  {
    label: "Completed",
    value: 11,
    className: "bg-emerald-500",
  },
  {
    label: "Testing",
    value: 5,
    className: "bg-amber-500",
  },
  {
    label: "Todo",
    value: 13,
    className: "bg-slate-400",
  },
];

function Dashboard() {
  return (
    <div className="min-h-full px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Overview
            </p> */}

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_245px]">
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
                <span>60</span>
                <span>45</span>
                <span>30</span>
                <span>15</span>
                <span>0</span>
              </div>

              {/* Chart */}
              <div className="relative flex flex-1 items-end gap-3 border-b border-slate-100">
                {/* Horizontal grid lines */}
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
                      className="relative z-10 w-full rounded-t-md bg-indigo-500 transition-opacity hover:opacity-80"
                      style={{
                        height:
                          item.value === 0
                            ? "0%"
                            : `${(item.value / 60) * 100}%`,
                      }}
                    />

                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-slate-400">
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

            <div className="mt-5 flex justify-center">
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full"
                style={{
                  background:
                    "conic-gradient(#8b5cf6 0deg 61deg, #6366f1 61deg 176deg, #10b981 176deg 251deg, #f59e0b 251deg 285deg, #9ca3af 285deg 360deg)",
                }}
              >
                <div className="h-16 w-16 rounded-full bg-white" />
              </div>
            </div>

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_245px]">
          {/* Recent projects */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-900">
                Recent projects
              </h2>

              <button
                type="button"
                className="text-[10px] font-medium text-violet-600 hover:text-violet-700"
              >
                View all
              </button>
            </div>

            <div className="space-y-2">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project.name}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-2.5 py-2"
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${project.avatarClass}`}
                  >
                    {project.initials}
                  </div>

                  {/* Project */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-900">
                      {project.name}
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-slate-500">
                      {project.company}
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
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-medium text-slate-900">
              Upcoming deadlines
            </h2>

            <div className="mt-4 space-y-4">
              {deadlines.map((deadline) => (
                <div key={deadline.title} className="flex gap-3">
                  <Clock3
                    size={14}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium leading-4 text-slate-800">
                      {deadline.title}
                    </p>

                    <p className="mt-0.5 text-[9px] text-slate-400">
                      {deadline.date}
                    </p>
                  </div>
                </div>
              ))}
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
