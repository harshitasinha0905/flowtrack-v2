import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { CreateTaskData, Task } from "../../types/task";
import { getProjects } from "../../services/projectServices";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getProfiles } from "../../services/profileServices";

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
  createTask?: (task: CreateTaskData) => void;
  mode: "create" | "edit";
  task?: Task | null;
  updateTask?: (id: string, task: Partial<CreateTaskData>) => void;
};

function CreateTaskForm({
  onClose,
  createTask,
  mode,
  task,
  updateTask,
}: CreateTaskFormProps) {
  // For the checklist option in modal
  const [checklist, setChecklist] = useState<string[]>([]);

  //User data
  const { user } = useAuth();

  // For populating project dropdown in the modal
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  // Fetch profiles
  const { data: profiles = [], isLoading: profileLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: getProfiles,
  });

  // useFormHook for creating form
  const { register, handleSubmit, reset } = useForm<TaskFormData>({
    defaultValues: {
      priority: "medium",
      status: "todo",
      assigned_to: user?.id ?? null,
    },
  });

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
      });
    }
  }, [user, reset, task, mode, profiles]);

  // Submitting the modal new task form
  function onSubmit(data: TaskFormData) {
    if (mode === "create" && createTask !== undefined) {
      createTask({
        ...data,
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
      });
    } else if (mode === "edit" && updateTask !== undefined && task) {
      updateTask(task.id, data);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Heading */}
      <div className="flex flex-col mb-4 text-left">
        <h2 className="text-lg font-semibold leading-none tracking-tight">
          {mode === "edit" ? `Edit task` : "New task"}
        </h2>
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Task title"
        {...register("title", {
          required: "Task title is required",
        })}
        className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm font-medium outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 bg-white"
      />

      {/* Description */}
      <textarea
        placeholder="Description"
        {...register("description")}
        className="min-h-[80px] w-full resize-none rounded-lg border border-zinc-200 p-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 bg-white"
      />

      {/* Project + Assignee */}
      <div className="grid grid-cols-2 gap-3">
        <select
          {...register("project_id", {
            required: "Project is required",
          })}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
        >
          <option value="">Select project</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select
          {...register("assigned_to")}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
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
          {...register("priority")}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </select>

        {/* Status */}
        <select
          {...register("status")}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
        >
          <option value="todo">todo</option>
          <option value="in_progress">in progress</option>
          <option value="review">review</option>
          <option value="done">done</option>
        </select>

        {/* Due date */}
        <input
          type="date"
          {...register("due_date")}
          className="h-10 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
        />

        {/* Labels */}
        <input
          type="text"
          placeholder="Labels (comma separated)"
          className="h-10 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
        />
      </div>

      {/* Checklist */}
      <div>
        <div className="mb-2 text-xs text-zinc-500">Checklist</div>

        <div className="space-y-1.5">
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="checkbox" className="h-3.5 w-3.5" />

              <input
                type="text"
                value={item}
                onChange={(event) => {
                  const updatedChecklist = [...checklist];
                  updatedChecklist[index] = event.target.value;
                  setChecklist(updatedChecklist);
                }}
                className="h-8 flex-1 rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
              />

              <button
                type="button"
                onClick={() => {
                  setChecklist(checklist.filter((_, i) => i !== index));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setChecklist([...checklist, ""])}
            className="text-xs text-indigo-600 hover:underline cursor-pointer"
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
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm transition hover:bg-zinc-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="h-9 rounded-lg bg-zinc-900 px-3 text-sm text-white transition hover:bg-zinc-800 cursor-pointer"
          >
            {mode === "edit" ? "Save changes" : "Create task"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateTaskForm;
