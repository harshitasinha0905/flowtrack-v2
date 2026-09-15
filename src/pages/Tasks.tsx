import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

import { Search, Plus, Trash2, Pencil } from "lucide-react";

import { useState } from "react";

import {
  deleteTasks,
  getTasks,
  updateTaskStatus,
} from "../services/taskServices";

import type { Task } from "../types/task";

import Modal from "../components/ui/Modal";
import CreateTaskForm from "../components/task/CreateTaskForm";
import SelectAllCheckbox from "../components/ui/SelectAllCheckbox";

import { useAuth } from "../context/AuthContext";

import { toast } from "sonner";

import { invalidateTaskRelatedQueries } from "../utils/queryInvalidations";

const features = tableFeatures({});

const columnHelper = createColumnHelper<typeof features, Task>();

function Tasks() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [searchTask, setSearchTask] = useState("");

  const [projectSelection, setProjectSelection] = useState("all_projects");

  const [statusSelection, setStatusSelection] = useState("all_statuses");

  const [prioritySelection, setPrioritySelection] = useState("all_priorities");

  const [sortByFilter, setSortByFilter] = useState("sort_by_due_date");

  const { user, profile } = useAuth();

  const queryClient = useQueryClient();

  const getTaskPermissions = (task: Task) => {
    const isAdmin = profile?.role === "admin";
    const isCreator = task.created_by === user?.id;
    const isAssignee = task.assigned_to === user?.id;

    return {
      canEdit: isAdmin || isCreator,
      canDelete: isAdmin || isCreator,
      canChangeStatus: isAdmin || isCreator || isAssignee,
    };
  };

  /*
   * Fetch tasks
   */
  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  /*
   * Columns
   */
  const columns = columnHelper.columns([
    columnHelper.display({
      id: "select",

      header: () => (
        <SelectAllCheckbox
          checked={tasks?.length > 0 && tasks?.length === selectedTaskIds.size}
          indeterminate={
            selectedTaskIds.size > 0 && selectedTaskIds.size < tasks.length
          }
          onChange={(e) => {
            setSelectedTaskIds((prev) => {
              const newSet = new Set(prev);

              if (e.target.checked) {
                tasks?.forEach((task) => newSet.add(task.id));
              } else {
                newSet.clear();
              }

              return newSet;
            });
          }}
        />
      ),

      cell: ({ row }) => (
        <input
          type="checkbox"
          className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300"
          checked={selectedTaskIds.has(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => {
            setSelectedTaskIds((prev) => {
              const next = new Set(prev);

              if (next.has(row.original.id)) {
                next.delete(row.original.id);
              } else {
                next.add(row.original.id);
              }

              return next;
            });
          }}
        />
      ),
    }),

    columnHelper.accessor("title", {
      header: "Title",
    }),

    columnHelper.accessor((row) => row.projects?.name ?? "No project", {
      id: "project",
      header: "Project",
    }),

    columnHelper.accessor((row) => row.profiles?.full_name ?? "Unassigned", {
      id: "assignee",
      header: "Assignee",
    }),

    columnHelper.accessor("priority", {
      header: "Priority",

      cell: ({ getValue }) => {
        const priority = getValue();

        const priorityStyles = {
          low: "bg-green-50 text-green-600",
          medium: "bg-amber-50 text-amber-600",
          high: "bg-orange-50 text-orange-600",
          urgent: "bg-red-50 text-red-600",
        };

        return (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium capitalize ${
              priorityStyles[priority]
            }`}
          >
            {priority}
          </span>
        );
      },
    }),

    columnHelper.accessor("status", {
      header: "Status",

      cell: ({ row }) => {
        const task = row.original;

        const permissions = getTaskPermissions(task);

        if (!permissions.canChangeStatus) {
          return (
            <span className="block w-full rounded-lg border border-zinc-200 bg-slate-100 px-2 py-1 text-[12px] capitalize text-slate-700 outline-none">
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
            className="cursor-pointer rounded-lg border border-zinc-200 bg-slate-100 px-1 py-1 text-[12px] text-slate-700 outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        );
      },
    }),

    columnHelper.accessor("due_date", {
      header: "Due",

      cell: ({ getValue }) => {
        const date = getValue();

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

              setSelectedTask(task);
              setIsFormOpen(true);
            }}
            className="cursor-pointer rounded-md border border-zinc-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Edit task"
          >
            <Pencil size={14} />
          </button>
        );
      },
    }),
  ]);

  /*
   * Mutation for updating task status
   */
  const { mutate: updateTaskStatusMutation, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
        updateTaskStatus(id, status),

      onSuccess: () => {
        invalidateTaskRelatedQueries(queryClient);

        toast.success("Task status updated");
      },

      onError: (error) => {
        toast.error(error.message || "Failed to update task status");
      },
    });

  /*
   * Mutation for deleting multiple tasks
   */
  const { mutate: deleteTasksMutation, isPending: isDeleting } = useMutation({
    mutationFn: (taskIds: string[]) => deleteTasks(taskIds),

    onSuccess: () => {
      invalidateTaskRelatedQueries(queryClient);

      setDeleteConfirmOpen(false);
      setSelectedTask(null);
      setSelectedTaskIds(new Set());

      toast.success("Task(s) deleted successfully");
    },

    onError: (error) => {
      toast.error(error.message || "Failed to delete task(s)");
    },
  });

  /*
   * Unique projects from tasks
   */
  const uniqueProjectTasks = (tasks ?? []).filter(
    (currentTask, currentIndex, originalTaskArray) => {
      const firstMatchingIndex = originalTaskArray.findIndex((item) => {
        return item.project_id === currentTask.project_id;
      });

      return currentIndex === firstMatchingIndex;
    },
  );

  const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;

  const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

  const priorityWeights = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  /*
   * Filtered tasks
   */
  const filteredTasks = (tasks ?? [])
    .filter((task) => {
      const basicCheck = task.title
        .toLowerCase()
        .includes(searchTask.toLowerCase());

      const projectCheck =
        projectSelection === "all_projects" ||
        task.project_id === projectSelection;

      const statusCheck =
        statusSelection === "all_statuses" || task.status === statusSelection;

      const priorityCheck =
        prioritySelection === "all_priorities" ||
        task.priority === prioritySelection;

      return basicCheck && projectCheck && statusCheck && priorityCheck;
    })
    .sort((a, b) => {
      if (sortByFilter === "sort_by_due_date" && a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }

      if (sortByFilter === "sort_by_priority") {
        const weightA = priorityWeights[a.priority] ?? 0;
        const weightB = priorityWeights[b.priority] ?? 0;

        return weightB - weightA;
      }

      return 0;
    });

  /*
   * Table
   */
  const table = useTable({
    features,
    data: filteredTasks ?? [],
    columns,
  });

  return (
    <div className="min-h-full space-y-6 px-4.5 py-5">
      {/* Header */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Tasks
          </h1>
        </div>

        <div className="flex gap-2">
          {selectedTaskIds.size > 0 && (
            <button
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm text-red-600 hover:bg-red-100"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 size={16} />
              Delete ({selectedTaskIds.size})
            </button>
          )}

          <button
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[11px] bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800"
            onClick={() => {
              setIsFormOpen(true);
              setSelectedTask(null);
            }}
          >
            <Plus size={16} />
            New task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-7 flex items-center gap-3">
        <div className="relative max-w-md flex-3">
          <input
            type="text"
            placeholder="Search tasks"
            className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-4 pl-11 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-zinc-300"
            value={searchTask}
            onChange={(e) => setSearchTask(e.target.value)}
          />

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <select
          className="h-9 flex-1 cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-zinc-300"
          value={projectSelection}
          onChange={(e) => setProjectSelection(e.target.value)}
        >
          <option value="all_projects">All projects</option>

          {uniqueProjectTasks.map((project) => (
            <option key={project.project_id} value={project.project_id}>
              {project?.projects?.name}
            </option>
          ))}
        </select>

        <select
          className="h-9 cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-zinc-300"
          value={statusSelection}
          onChange={(e) => setStatusSelection(e.target.value)}
        >
          <option value="all_statuses">All statuses</option>

          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className="h-9 cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-zinc-300"
          value={prioritySelection}
          onChange={(e) => setPrioritySelection(e.target.value)}
        >
          <option value="all_priorities">All priorities</option>

          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <select
          className="h-9 cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-zinc-300"
          value={sortByFilter}
          onChange={(e) => setSortByFilter(e.target.value)}
        >
          <option value="sort_by_due_date">Sort by due date</option>

          <option value="sort_by_priority">Sort by priority</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-100 bg-zinc-50/50 text-xs text-zinc-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-5 py-3 text-left text-xs font-medium text-slate-500 ${
                      header.id === "select" ? "w-10" : ""
                    }`}
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
                    className={`px-3.5 py-4 text-[13px] text-slate-700 ${
                      cell.column.id === "select" ? "w-10" : ""
                    }`}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Create/Edit Task Modal */}
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
            />
          </Modal>
        )}

        {/* Delete Confirmation */}
        {isDeleteConfirmOpen && (
          <Modal onClose={() => setDeleteConfirmOpen(false)}>
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Delete tasks?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Are you sure you want to delete{" "}
                  <span className="font-bold">{selectedTaskIds.size}</span>{" "}
                  selected tasks?
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                  className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  className="cursor-pointer rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => deleteTasksMutation([...selectedTaskIds])}
                >
                  {isDeleting ? "Deleting..." : "Delete Task"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

export default Tasks;
