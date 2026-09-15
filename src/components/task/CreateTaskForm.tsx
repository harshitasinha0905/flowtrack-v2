import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateTaskData, Task } from "../../types/task";

import { getProjects } from "../../services/projectServices";
import { createTask, updateTask } from "../../services/taskServices";
import { getProfiles } from "../../services/profileServices";

import { useAuth } from "../../context/AuthContext";

import { invalidateTaskRelatedQueries } from "../../utils/queryInvalidations";

import { toast } from "sonner";

type TaskFormData = {
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "review" | "done";
  due_date: string | null;
};

type CreateTaskFormProps = {
  onClose: () => void;
  mode: "create" | "edit";
  task?: Task | null;
  project_id?: string;
};

function CreateTaskForm({
  onClose,
  mode,
  task,
  project_id,
}: CreateTaskFormProps) {
  // For the checklist option in modal
  const [checklist, setChecklist] = useState<string[]>([]);

  // User data
  const { user } = useAuth();

  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: getProfiles,
  });

  // Form
  const { register, handleSubmit, reset } = useForm<TaskFormData>({
    defaultValues: {
      priority: "medium",
      status: "todo",
      assigned_to: user?.id ?? null,
      project_id: project_id ?? "",
    },
  });

  /*
   * Create task mutation
   */
  const { mutate: createTaskMutation, isPending: isCreating } = useMutation({
    mutationFn: (task: CreateTaskData) => createTask(task),

    onSuccess: () => {
      invalidateTaskRelatedQueries(queryClient);

      reset();

      onClose();

      toast.success("Task created successfully");
    },

    onError: (error) => {
      toast.error(error.message || "Failed to create task");
    },
  });

  /*
   * Update task mutation
   */
  const { mutate: updateTaskMutation, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, task }: { id: string; task: Partial<CreateTaskData> }) =>
      updateTask(id, task),

    onSuccess: () => {
      invalidateTaskRelatedQueries(queryClient);

      reset();

      onClose();

      toast.success("Task updated successfully");
    },

    onError: (error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  const isPending = isCreating || isUpdating;

  /*
   * Populate form when editing or creating
   */
  useEffect(() => {
    if (mode === "edit" && task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        project_id: task.project_id,
        assigned_to: task.assigned_to ?? "",
        priority: task.priority,
        status: task.status,
        due_date: task.due_date ?? "",
      });
    } else if (mode === "create" && user) {
      reset({
        priority: "medium",
        status: "todo",
        assigned_to: user.id,
        project_id: project_id ?? "",
      });
    }
  }, [user, reset, task, mode, project_id, profiles]);

  /*
   * Submit form
   */
  function onSubmit(data: TaskFormData) {
    const normalizedData = {
      ...data,
      assigned_to: data.assigned_to || null,
      due_date: data.due_date || null,
    };

    if (mode === "create") {
      createTaskMutation(normalizedData);
    } else if (task) {
      updateTaskMutation({
        id: task.id,
        task: normalizedData,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Heading */}
      <div className="mb-4 flex flex-col text-left">
        <h2 className="text-lg font-semibold leading-none tracking-tight">
          {mode === "edit" ? "Edit task" : "New task"}
        </h2>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Task title"
        disabled={isPending}
        {...register("title", {
          required: "Task title is required",
        })}
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
      />

      {/* Description */}
      <textarea
        placeholder="Description"
        disabled={isPending}
        {...register("description")}
        className="min-h-[80px] w-full resize-none rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
      />

      {/* Project + Assignee */}
      <div className="grid grid-cols-2 gap-3">
        {!project_id && (
          <select
            disabled={isPending}
            {...register("project_id", {
              required: "Project is required",
            })}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
          >
            <option value="">Select project</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}

        {project_id && (
          <>
            {/* Keep project_id in form data */}
            <input
              type="hidden"
              {...register("project_id", {
                required: "Project is required",
              })}
            />

            {/* Display project name only */}
            <input
              type="text"
              value={
                projects.find((project) => project.id === project_id)?.name ??
                ""
              }
              readOnly
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium outline-none"
            />
          </>
        )}

        {/* Assignee */}
        <select
          disabled={isPending}
          {...register("assigned_to")}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
        >
          <option value="">Unassigned</option>

          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          disabled={isPending}
          {...register("priority")}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </select>

        {/* Status */}
        <select
          disabled={isPending}
          {...register("status")}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
        >
          <option value="todo">todo</option>
          <option value="in_progress">in progress</option>
          <option value="review">review</option>
          <option value="done">done</option>
        </select>

        {/* Due date */}
        <input
          type="date"
          disabled={isPending}
          {...register("due_date")}
          className="h-10 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
        />

        {/* Labels */}
        <input
          type="text"
          placeholder="Labels (comma separated)"
          disabled={isPending}
          className="h-10 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
        />
      </div>

      {/* Checklist */}
      <div>
        <div className="mb-2 text-xs text-zinc-500">Checklist</div>

        <div className="space-y-1.5">
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                disabled={isPending}
                className="h-3.5 w-3.5"
              />

              <input
                type="text"
                value={item}
                disabled={isPending}
                onChange={(event) => {
                  const updatedChecklist = [...checklist];
                  updatedChecklist[index] = event.target.value;
                  setChecklist(updatedChecklist);
                }}
                className="h-8 flex-1 rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 disabled:bg-zinc-50"
              />

              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setChecklist(checklist.filter((_, i) => i !== index));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={isPending}
            onClick={() => setChecklist([...checklist, ""])}
            className="cursor-pointer text-xs text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add checklist item
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <span />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-lg bg-zinc-900 px-3 text-sm text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save changes"
                : "Create task"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateTaskForm;
