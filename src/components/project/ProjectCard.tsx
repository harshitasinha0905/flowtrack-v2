import { MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";
import type { Project, ProjectWithStats } from "../../types/project";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "../../services/projectServices";

type ProjectCardProps = {
  project: ProjectWithStats;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
  onClick: () => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProjectCard({
  project,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
  onEdit,
  onArchive,
  onDelete,
  onClick,
}: ProjectCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onMenuClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, onMenuClose]);

  const initials = getInitials(project.name);

  const completedTasks = project.completedTasks;
  const totalTasks = project.totalTasks;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      onClick={onClick}
    >
      {/* Top */}
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-sm font-semibold text-violet-700">
          {initials}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            aria-label={`Actions for ${project.name}`}
          >
            <MoreHorizontal size={20} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-30 w-32 overflow-hidden rounded-xl border border-slate-300 bg-[#FDFDFD] py-2 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              {/* Edit */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle();
                  onEdit(project);
                }}
                className="flex w-full items-center gap-4 px-3 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <Pencil size={16} />
                <span>Edit</span>
              </button>

              {/* Archive */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle();
                  onArchive(project);
                }}
                className="flex w-full items-center gap-4 px-3 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                <Archive size={16} />
                <span>
                  {project.status === "archived" ? "Unarchive" : "Archive"}
                </span>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuToggle();
                  onDelete(project);
                }}
                className="flex w-full items-center gap-4 px-3 py-1.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project information */}
      <div className="mt-3">
        <h2 className="text-base font-semibold text-slate-900">
          {project.name}
        </h2>

        <p className="mt-1 truncate text-xs text-slate-500">
          {project.client_name || ""}
        </p>
      </div>

      {/* Status */}
      <div className="mt-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
            project.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : project.status === "completed"
                ? "bg-slate-100 text-slate-600"
                : "bg-amber-50 text-amber-600"
          }`}
        >
          {project.status}
        </span>

        <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
          medium
        </span>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>{progress}%</span>

          <span>
            {completedTasks}/{totalTasks}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-medium text-white">
            AM
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-500 text-[10px] font-medium text-white">
            JL
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-medium text-white">
            SK
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-medium text-white">
            NP
          </div>
        </div>

        <span className="text-[11px] text-slate-500">Due Sep 19</span>
      </div>
    </div>
  );
}

export default ProjectCard;
