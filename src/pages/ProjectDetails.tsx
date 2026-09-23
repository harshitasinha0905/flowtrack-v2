import { ArrowLeft, Loader2, Pencil, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

import {
  getProjectById,
  getProjectMembers,
  getProjectSprintData,
} from "../services/projectServices";

import {
  getTasksByProject,
  getTaskStats,
  updateTaskStatus,
} from "../services/taskServices";

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

import type { Task } from "../types/task";

import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

import { invalidateTaskRelatedQueries } from "../utils/queryInvalidations";

import CreateTaskForm from "../components/task/CreateTaskForm";
import Modal from "../components/ui/Modal";

import {
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import {
  generateSprintSummary,
  type SprintSummaryResponse,
} from "../services/aiServices";
import ProjectDetailsSkeleton from "../components/skeletons/ProjectDetailsSkeleton";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/*
 * Avatar colors
 */
const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const getAvatarColor = (name: string) => {
  const index = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return avatarColors[index % avatarColors.length];
};

function KanbanTaskCard({
  task,
  onClick,
  children,
  className,
}: {
  task: Task;
  onClick: () => void;
  children: React.ReactNode;
  className: string;
}) {
  const { ref, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={ref}
      onClick={() => {
        if (!isDragging) {
          onClick();
        }
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function KanbanTaskPreview({ task }: { task: Task }) {
  return (
    <div className=" rounded-xl border border-zinc-200 bg-white p-3 shadow-xl opacity-60">
      <div className="text-sm leading-snug text-zinc-900">{task.title}</div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            task.priority === "low"
              ? "bg-zinc-100 text-zinc-600"
              : task.priority === "medium"
                ? "bg-blue-50 text-blue-700"
                : task.priority === "high"
                  ? "bg-orange-50 text-orange-700"
                  : "bg-red-50 text-red-700"
          }`}
        >
          {task.priority}
        </span>

        {task.profiles?.full_name ? (
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${getAvatarColor(
              task.profiles.full_name,
            )}`}
          >
            {task.profiles.full_name
              .split(" ")
              .map((name) => name[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-500">
            ?
          </div>
        )}
      </div>

      {task.due_date && (
        <div className="mt-3 text-[11px] text-zinc-400">
          Due{" "}
          {new Date(task.due_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({
    id,
  });

  return (
    <div
      ref={ref}
      className={`min-h-[400px] rounded-2xl border p-3 transition-colors ${
        isDropTarget
          ? "border-blue-400 bg-blue-50"
          : "border-zinc-200 bg-zinc-50/60"
      }`}
    >
      {children}
    </div>
  );
}

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isSprintSummaryOpen, setIsSprintSummaryOpen] = useState(false);
  const [sprintSummary, setSprintSummary] =
    useState<SprintSummaryResponse | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  /*
   * Project
   */
  const {
    data: project,
    isLoading: isProjectLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId!),
    enabled: !!projectId,
  });

  /*
   * Project task statistics
   */
  const {
    data: projectTaskStats,
    isLoading: isTaskStatsLoading,
    error: taskStatsError,
  } = useQuery({
    queryKey: ["project-task-stats", projectId],
    queryFn: () => getTaskStats(projectId!),
    enabled: !!projectId,
  });

  const totalTasks = projectTaskStats?.totalTasks ?? 0;
  const completedTasks = projectTaskStats?.completedTasks ?? 0;

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  /*
   * Project tasks
   */
  const { data: projectTasks, isLoading: isProjectTasksLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: () => getTasksByProject(projectId!),
    enabled: !!projectId,
  });

  /*
   * Auth / permissions
   */
  const { user, profile } = useAuth();

  const getTaskPermissions = (task: Omit<Task, "projects">) => {
    const isAdmin = profile?.role === "admin";
    const isCreator = task.created_by === user?.id;
    const isAssignee = task.assigned_to === user?.id;

    return {
      canEdit: isAdmin || isCreator,
      canDelete: isAdmin || isCreator,
      canChangeStatus: isAdmin || isCreator || isAssignee,
    };
  };

  //   Team members query

  const { data: projectMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => getProjectMembers(projectId!),
    enabled: !!projectId,
  });

  // Get AI Sprint data
  const {
    data: selectedProjectTasks,
    isLoading: isLoadingProjectTasks,
    error: projectTasksError,
  } = useQuery({
    queryKey: ["project-sprint-data", projectId],
    queryFn: () => getProjectSprintData(projectId!),
    enabled: !!projectId,
  });

  async function handleSprintSummary() {
    if (!projectId) {
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

  /*
   * Update task status
   */
  const { mutate: updateTaskStatusMutation, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
        updateTaskStatus(id, status),

      onMutate: async ({ id, status }) => {
        await queryClient.cancelQueries({
          queryKey: ["project-tasks", projectId],
        });

        const previousTasks = queryClient.getQueryData<Task[]>([
          "project-tasks",
          projectId,
        ]);

        queryClient.setQueryData<Task[]>(
          ["project-tasks", projectId],
          (oldTasks) =>
            oldTasks?.map((task) =>
              task.id === id ? { ...task, status } : task,
            ),
        );

        return { previousTasks };
      },

      onSuccess: () => {
        invalidateTaskRelatedQueries(queryClient);

        queryClient.invalidateQueries({
          queryKey: ["project-tasks", projectId],
        });

        queryClient.invalidateQueries({
          queryKey: ["project-task-stats", projectId],
        });

        toast.success("Task status updated");
      },

      onError: (error, _variables, context) => {
        if (context?.previousTasks) {
          queryClient.setQueryData(
            ["project-tasks", projectId],
            context.previousTasks,
          );
        }

        toast.error(error.message || "Failed to update task status");
      },
    });

  /*
   * Table columns
   */
  const features = tableFeatures({});

  const columnHelper = createColumnHelper<
    typeof features,
    Omit<Task, "projects">
  >();

  const columns = columnHelper.columns([
    columnHelper.accessor("title", {
      header: "Title",
    }),

    columnHelper.accessor("status", {
      header: "Status",

      cell: ({ row }) => {
        const task = row.original;
        const permissions = getTaskPermissions(task);

        if (!permissions.canChangeStatus) {
          return (
            <span className="capitalize rounded-lg border border-zinc-200 bg-slate-100 px-2 py-1 text-[12px] text-slate-700">
              {task.status.replace("_", " ")}
            </span>
          );
        }

        return (
          <select
            value={task.status}
            disabled={isUpdatingStatus}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              updateTaskStatusMutation({
                id: task.id,
                status: e.target.value as Task["status"],
              });
            }}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-slate-100 px-1 py-1 text-[12px] text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        );
      },
    }),

    columnHelper.accessor("priority", {
      header: "Priority",
    }),

    columnHelper.accessor((row) => row.profiles?.full_name ?? "Unassigned", {
      id: "assignee",
      header: "Assignee",
    }),

    columnHelper.accessor("due_date", {
      header: "Due",

      cell: (data) => {
        const date = data.getValue();

        if (!date) {
          return "—";
        }

        return new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      },
    }),

    columnHelper.display({
      id: "actions",
      header: "Actions",

      cell: ({ row }) => {
        const task = row.original;
        const permissions = getTaskPermissions(task);

        if (!permissions.canEdit) {
          return null;
        }

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              setSelectedTask(task as Task);
              setIsFormOpen(true);
            }}
            className="rounded-md border border-zinc-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Edit task"
          >
            <Pencil size={14} />
          </button>
        );
      },
    }),
  ]);

  /*
   * Table
   */
  const table = useTable({
    features,
    data: projectTasks ?? [],
    columns,
  });

  /*
   * Loading / error states
   */
  if (isProjectLoading) {
    return <ProjectDetailsSkeleton />;
  }

  if (error || !project) {
    return <div>Project could not be loaded.</div>;
  }

  /*
   * Kanban columns
   */
  const kanbanColumns = [
    {
      status: "todo",
      label: "Todo",
    },
    {
      status: "in_progress",
      label: "In Progress",
    },
    {
      status: "review",
      label: "Review",
    },
    {
      status: "done",
      label: "Done",
    },
  ];

  /*
   * Render
   */
  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/projects")}
        className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Projects</span>
      </button>

      {/* Project header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Project avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700">
            {getInitials(project.name)}
          </div>

          {/* Project information */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {project.name}
            </h1>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {project.client_name ?? "No client"}
              </span>

              <span className="text-slate-300">•</span>

              <span
                className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                  project.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : project.status === "completed"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-amber-50 text-amber-600"
                }`}
              >
                {project.status}
              </span>

              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                Medium
              </span>
            </div>
          </div>
        </div>

        {/* AI Sprint Summary */}
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 cursor-pointer"
          onClick={function () {
            setSprintSummary(null);
            setIsSprintSummaryOpen(true);
          }}
        >
          <Sparkles size={16} />
          AI Sprint Summary
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Progress</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {progress}%
          </p>
        </div>

        {/* Total tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total tasks</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {totalTasks}
          </p>
        </div>

        {/* Completed */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Completed</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {completedTasks}
          </p>
        </div>

        {/* Members */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Members</p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">0</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "tasks", label: "Tasks" },
            { id: "kanban", label: "Kanban" },
            { id: "team", label: "Team" },
            { id: "files", label: "Files" },
            { id: "activity", label: "Activity" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}

              {activeTab === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-slate-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {project.description || "No project description available."}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Client */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Client
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {project.client_name || "No client"}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <p className="mt-1 text-sm font-medium capitalize text-slate-900">
                  {project.status}
                </p>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Priority
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  Medium
                </p>
              </div>

              {/* Due date */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Due date
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  Not set
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tasks */}
        {activeTab === "tasks" && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <div className="text-sm font-medium">All tasks</div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  setIsFormOpen(true);
                }}
                className="h-8 cursor-pointer rounded-lg bg-zinc-900 px-3 text-xs text-white hover:bg-zinc-800"
              >
                + Task
              </button>
            </div>

            {isProjectTasksLoading ? (
              <div className="p-6 text-sm text-slate-500">Loading tasks...</div>
            ) : projectTasks?.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No tasks in this project yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-100 text-xs text-zinc-500">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-2 text-left font-medium"
                        >
                          {header.isPlaceholder ? null : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      {row.getAllCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3.5 py-4 text-[13px] text-slate-700"
                        >
                          <table.FlexRender cell={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Kanban */}

        {activeTab === "kanban" && (
          <DragDropProvider
            onDragStart={(event) => {
              const taskId = String(event.operation?.source?.id);

              const task = projectTasks?.find((task) => task.id === taskId);

              setDraggedTask(task ?? null);
            }}
            onDragEnd={(event) => {
              if (event.canceled) return;

              const { source, target } = event.operation;

              if (!source || !target) return;

              const taskId = String(source.id);
              const newStatus = String(target.id) as Task["status"];

              const task = projectTasks?.find((task) => task.id === taskId);

              if (!task || task.status === newStatus) return;

              updateTaskStatusMutation({
                id: taskId,
                status: newStatus,
              });
              setDraggedTask(null);
            }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {kanbanColumns.map((column) => (
                <KanbanColumn key={column.status} id={column.status}>
                  <div key={column.status}>
                    {/* Column header */}
                    <div className="mb-4 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        {column.status === "todo" && (
                          <span className="h-2 w-2 rounded-full bg-zinc-500" />
                        )}

                        {column.status === "in_progress" && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        )}

                        {column.status === "review" && (
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                        )}

                        {column.status === "done" && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        )}

                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                          {column.label}
                        </span>
                      </div>

                      <span className="text-xs text-zinc-400">
                        {
                          projectTasks?.filter(
                            (task) => task.status === column.status,
                          ).length
                        }
                      </span>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-2">
                      {projectTasks
                        ?.filter((task) => task.status === column.status)
                        .map((t) => {
                          return (
                            <KanbanTaskCard
                              key={t.id}
                              task={t}
                              onClick={() => {
                                setSelectedTask(t);
                                setIsFormOpen(true);
                              }}
                              className="cursor-grab rounded-xl border border-zinc-200 bg-white p-3 transition-shadow active:cursor-grabbing hover:shadow-md"
                            >
                              {/* Task title */}
                              <div className="text-sm leading-snug text-zinc-900">
                                {t.title}
                              </div>

                              {/* Priority + Avatar */}
                              <div className="mt-3 flex items-center justify-between">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                                    t.priority === "low"
                                      ? "bg-zinc-100 text-zinc-600"
                                      : t.priority === "medium"
                                        ? "bg-blue-50 text-blue-700"
                                        : t.priority === "high"
                                          ? "bg-orange-50 text-orange-700"
                                          : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {t.priority}
                                </span>

                                {t.profiles?.full_name ? (
                                  <div
                                    title={t.profiles.full_name}
                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${getAvatarColor(
                                      t.profiles.full_name,
                                    )}`}
                                  >
                                    {t.profiles.full_name
                                      .split(" ")
                                      .map((name: string) => name[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                ) : (
                                  <div
                                    title="Unassigned"
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-500"
                                  >
                                    ?
                                  </div>
                                )}
                              </div>

                              {/* Due date */}
                              {t.due_date && (
                                <div className="mt-3 text-[11px] text-zinc-400">
                                  Due{" "}
                                  {new Date(t.due_date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </div>
                              )}
                            </KanbanTaskCard>
                          );
                        })}

                      {/* Empty state */}
                      {projectTasks?.filter(
                        (task) => task.status === column.status,
                      ).length === 0 && (
                        <div className="py-8 text-center text-xs text-zinc-400">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  </div>
                </KanbanColumn>
              ))}
            </div>
            <DragOverlay>
              {draggedTask ? <KanbanTaskPreview task={draggedTask} /> : null}
            </DragOverlay>
          </DragDropProvider>
        )}

        {activeTab === "team"}

        {/* Other tabs */}
        {activeTab !== "overview" &&
          activeTab !== "tasks" &&
          activeTab !== "kanban" &&
          activeTab !== "team" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} coming
                soon.
              </p>
            </div>
          )}
      </div>

      {/* Create / Edit Task Modal */}
      {isFormOpen && (
        <Modal
          className="max-w-2xl"
          onClose={() => {
            setIsFormOpen(false);
            setSelectedTask(null);
          }}
        >
          <CreateTaskForm
            onClose={() => {
              setIsFormOpen(false);
              setSelectedTask(null);
            }}
            mode={selectedTask ? "edit" : "create"}
            task={selectedTask}
            project_id={project.id}
          />
        </Modal>
      )}

      {/* Sprint summary drawer */}

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
            {/* <label className="mb-2 block text-xs font-medium text-slate-700">
              Project
            </label> */}

            {/* <select
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
            </select> */}

            <button
              type="button"
              onClick={handleSprintSummary}
              disabled={isGeneratingSummary}
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

export default ProjectDetails;
