import { ArrowLeft, Divide, Pencil, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useRef, useState } from "react";

import { getProjectById } from "../services/projectServices";

import {
  createTask,
  getTasksByProject,
  getTaskStats,
  updateTask,
  updateTaskStatus,
} from "../services/taskServices";

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

import type { CreateTaskData, Task } from "../types/task";

import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

import { invalidateTaskRelatedQueries } from "../utils/queryInvalidations";

import CreateTaskForm from "../components/task/CreateTaskForm";
import Modal from "../components/ui/Modal";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Avatar colors

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

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

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

  // Update task status
  const { mutate: updateTaskStatusMutation, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
        updateTaskStatus(id, status),

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

      onError: (error) => {
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
    return <div>Loading...</div>;
  }

  if (error || !project) {
    return <div>Project could not be loaded.</div>;
  }

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
          className="flex shrink-0 items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
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

        {activeTab === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kanbanColumns.map((column) => (
              <div
                key={column.status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  // we'll implement this next
                }}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 min-h-[400px] transition-colors"
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    {column.status === "todo" && (
                      <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                    )}
                    {column.status === "in_progress" && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    )}
                    {column.status === "review" && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                    {column.status === "done" && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
                <div className="space-y-2">
                  {projectTasks
                    ?.filter((task) => task.status === column.status)
                    .map((t) => {
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedTask(t);

                            if (dragPreviewRef.current) {
                              dragPreviewRef.current.style.visibility =
                                "visible";

                              e.dataTransfer.setDragImage(
                                dragPreviewRef.current,
                                20,
                                20,
                              );
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedTask(null);
                            if (dragPreviewRef.current) {
                              dragPreviewRef.current.style.visibility =
                                "hidden";
                            }
                          }}
                          onClick={() => {
                            setSelectedTask(t);
                            setIsFormOpen(true);
                          }}
                          className="bg-white rounded-xl border border-zinc-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        >
                          <div className="text-sm text-zinc-900 leading-snug">
                            {t.title}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
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
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${getAvatarColor(
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
                              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-500">
                                ?
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {projectTasks?.filter((task) => task.status === column.status)
                    .length === 0 && (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      Drop tasks here
                    </div>
                  )}
                </div>
                <div
                  ref={dragPreviewRef}
                  className="fixed top-0 left-0 w-64 bg-white rounded-xl border border-zinc-200 p-3 shadow-lg pointer-events-none"
                  style={{
                    visibility: "hidden",
                  }}
                >
                  <div className="text-sm text-zinc-900">
                    {draggedTask?.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other tabs */}
        {activeTab !== "overview" &&
          activeTab !== "tasks" &&
          activeTab !== "kanban" && (
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
    </div>
  );
}

export default ProjectDetails;
