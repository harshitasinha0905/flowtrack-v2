import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { createProject, updateProject } from "../../services/projectServices";

import type { Project } from "../../types/project";
import { dashboardQueryKeys } from "../../utils/queryKeys";

type CreateProjectFormData = {
  name: string;
  description: string;
  status: "active" | "completed" | "archived";
  client_name: string;
};

type CreateProjectFormProps = {
  onClose: () => void;
  project?: Project;
};

function CreateProjectForm({ onClose, project }: CreateProjectFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      client_name: "",
      status: project?.status ?? "active",
    },
  });

  useEffect(() => {
    reset({
      name: project?.name ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "active",
      client_name: project?.client_name ?? "",
    });
  }, [project, reset]);

  const { mutate: saveProject, isPending } = useMutation({
    mutationFn: (data: CreateProjectFormData) => {
      if (project) {
        return updateProject(project.id, data);
      }

      return createProject(data);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

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

      reset();
      onClose();
    },
  });

  function onSubmit(data: CreateProjectFormData) {
    saveProject(data);
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {project ? "Edit project" : "New project"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {project
            ? "Update your project details."
            : "Create a new project to start tracking your work."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Project name */}
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Project name
          </label>

          <input
            id="name"
            type="text"
            placeholder="e.g. Aurora Web Platform"
            disabled={isPending}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 bg-white"
            {...register("name", {
              required: "Project name is required",
            })}
          />

          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Client name  */}

        <div>
          <label
            htmlFor="client_name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Client name
          </label>

          <input
            id="client_name"
            type="text"
            placeholder="Enter client name"
            disabled={isPending}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 bg-white"
            {...register("client_name")}
          />

          {errors.name && (
            <p className="mt-1 text-xs text-red-500">
              {errors?.client_name?.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Description
          </label>

          <textarea
            id="description"
            rows={3}
            placeholder="What is this project about?"
            disabled={isPending}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 bg-white"
            {...register("description")}
          />
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Status
          </label>

          <select
            id="status"
            disabled={isPending}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
            {...register("status")}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isPending
              ? project
                ? "Saving..."
                : "Creating..."
              : project
                ? "Save changes"
                : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProjectForm;
