import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Filter } from "lucide-react";

import {
  getProjects,
  updateProject,
  deleteProject,
} from "../services/projectServices";
import Modal from "../components/ui/Modal";
import CreateProjectForm from "../components/project/CreateProjectForm";
import ProjectCard from "../components/project/ProjectCard";
import type { Project } from "../types/project";
import { useSearchParams } from "react-router-dom";

function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const queryClient = useQueryClient();

  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const { mutate: archiveProject, isPending: isArchiving } = useMutation({
    mutationFn: (project: Project) =>
      updateProject(project.id, {
        name: project.name,
        description: project.description ?? "",
        status: project.status === "archived" ? "active" : "archived",
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });

  const { mutate: deleteProjectMutation, isPending: isDeleting } = useMutation({
    mutationFn: (project: Project) => deleteProject(project.id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });

      setProjectToDelete(null);
    },
  });

  const filteredProjects = (projects ?? [])
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (statusFilter === "all" || p.status === statusFilter),
    )
    .sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  return (
    <div className="min-h-full px-4.5 py-5">
      <div className="mx-auto max-w-300">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            {/* <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
              Workspace
            </p> */}

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              Projects
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedProject(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-[10px] bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 cursor-pointer"
          >
            <Plus size={17} />
            New project
          </button>
        </div>

        {/* Search and filters */}
        <div className="mt-6 flex gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search projects"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-slate-300"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Recent</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Projects */}
        <div className="mt-7">
          {isLoading && (
            <div className="py-20 text-center text-sm text-slate-400">
              Loading projects...
            </div>
          )}
          {error && (
            <div className="py-20 text-center text-sm text-red-500">
              Could not load projects.
            </div>
          )}
          {!isLoading && !error && projects?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center">
              <h2 className="text-base font-medium text-slate-900">
                No projects yet
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create your first project to get started.
              </p>

              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
              >
                Create project
              </button>
            </div>
          )}

          {!isLoading &&
            !error &&
            projects &&
            projects.length > 0 &&
            (filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isMenuOpen={openMenuId === project.id}
                    onMenuToggle={() =>
                      setOpenMenuId((currentId) =>
                        currentId === project.id ? null : project.id,
                      )
                    }
                    onMenuClose={() => setOpenMenuId(null)}
                    onEdit={(project) => {
                      setSelectedProject(project);
                      setIsFormOpen(true);
                    }}
                    onArchive={(project) => archiveProject(project)}
                    onDelete={(project) => setProjectToDelete(project)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-50 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                <div className="flex flex-col items-center">
                  <Filter
                    size={42}
                    strokeWidth={1.5}
                    className="text-slate-300"
                  />

                  <p className="mt-4 text-sm font-medium text-slate-500">
                    No projects match your filters
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Create project modal */}
      {isFormOpen && (
        <Modal
          onClose={() => {
            setIsFormOpen(false);
            setSearchParams({});
            setSelectedProject(null);
          }}
        >
          <CreateProjectForm
            project={selectedProject ?? undefined}
            onClose={() => {
              setIsFormOpen(false);
              setSearchParams({});
              setSelectedProject(null);
            }}
          />
        </Modal>
      )}

      {/* Delete project modal */}

      {projectToDelete && (
        <Modal
          onClose={() => {
            if (!isDeleting) {
              setProjectToDelete(null);
            }
          }}
        >
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Delete project
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to delete{" "}
                <span className="font-medium text-slate-700">
                  "{projectToDelete.name}"
                </span>
                ?
              </p>

              <p className="mt-1 text-sm text-slate-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => deleteProjectMutation(projectToDelete)}
                disabled={isDeleting}
                className="cursor-pointer rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete project"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Projects;
