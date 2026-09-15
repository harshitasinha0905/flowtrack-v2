import { Pencil, Trash2 } from "lucide-react";

type TeamMemberCardProps = {
  initials: string;
  name: string;
  role: string;
  department: string;
  email: string;
  projects: number;
  tasks: number;
  workload: number;
};

function TeamMemberCard({
  initials,
  name,
  role,
  department,
  email,
  projects,
  tasks,
  workload,
}: TeamMemberCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {/* Avatar + actions */}
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-xl font-medium text-white">
          {initials}
        </div>

        {/* <div className="flex items-center gap-4 text-slate-500">
          <button
            type="button"
            className="cursor-pointer transition hover:text-slate-900"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            className="cursor-pointer transition hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div> */}
      </div>

      {/* Member information */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-900">{name}</h2>

        <p className="mt-1 text-xs text-slate-500">
          {/* {role} • {department} */}
          {role}
        </p>

        <p className="mt-1 text-xs text-slate-500">{email}</p>
      </div>

      {/* Projects + Tasks */}
      <div className="mt-4 flex gap-12">
        <div>
          <p className="text-xs text-slate-500">Projects</p>
          <p className="mt-1 text-xs font-semibold text-zinc-900">{projects}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Tasks</p>
          <p className="mt-1 text-xs font-semibold text-zinc-900">{tasks}</p>
        </div>
      </div>

      {/* Workload */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Workload</span>
          <span className="text-slate-500">{workload}%</span>
        </div>

        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${workload}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default TeamMemberCard;
