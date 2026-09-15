import { Bell, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { searchProjects } from "../../services/projectServices";
import { searchTasks } from "../../services/taskServices";

function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: searchProjectsData, isLoading: isSearchingProjects } = useQuery(
    {
      queryKey: ["global-search-projects", searchTerm],
      queryFn: () => searchProjects(searchTerm),
      enabled: searchTerm.trim().length >= 1,
    },
  );

  const { data: searchTasksData, isLoading: isSearchingTasks } = useQuery({
    queryKey: ["global-search-tasks", searchTerm],
    queryFn: () => searchTasks(searchTerm),
    enabled: searchTerm.trim().length >= 1,
  });

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <header className="flex h-17 items-center gap-6 border-b border-slate-200 bg-white px-9">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={18}
          strokeWidth={1.8}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={searchTerm}
          onChange={function (event) {
            setSearchTerm(event.target.value);
          }}
          onFocus={function () {
            setIsSearchFocused(true);
          }}
          placeholder="Search projects, tasks, people..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-[rgb(250,250,250)] pl-10.25 pr-16 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        />

        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm text-slate-400">
          <span className="text-base">⌘</span>
          <span>K</span>
        </div>

        {isSearchFocused && searchTerm.trim().length >= 1 && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {/* Projects */}
            {searchProjectsData && searchProjectsData.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Projects
                </p>

                {searchProjectsData.map(function (project) {
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={function () {
                        navigate(`/projects/${project.id}`);
                        setSearchTerm("");
                        setIsSearchFocused(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-semibold text-violet-700">
                        {project.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {project.name}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {project.client_name ?? "No client"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tasks */}
            {searchTasksData && searchTasksData.length > 0 && (
              <div className="border-t border-slate-100 p-2">
                <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Tasks
                </p>

                {searchTasksData.map(function (task) {
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={function () {
                        navigate(`/projects/${task.project_id}`);
                        setSearchTerm("");
                        setIsSearchFocused(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Search size={14} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {task.title}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {task.projects?.[0]?.name ?? "Unknown project"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading */}
            {(isSearchingProjects || isSearchingTasks) && (
              <div className="px-4 py-3 text-sm text-slate-500">
                Searching...
              </div>
            )}

            {/* No results */}
            {!isSearchingProjects &&
              !isSearchingTasks &&
              searchProjectsData?.length === 0 &&
              searchTasksData?.length === 0 && (
                <div className="px-4 py-5 text-center text-sm text-slate-500">
                  No results found
                </div>
              )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-7">
        {/* <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-500 px-4 text-[14px] font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-purple-600 cursor-pointer"
        >
          <Sparkles size={18} />
          AI Task Breakdown
        </button> */}

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 cursor-pointer"
        >
          <Bell size={20} strokeWidth={1.8} />
        </button>

        {/* User avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-base font-semibold text-white">
          {userInitial}
        </div>
      </div>
    </header>
  );
}

export default Header;
