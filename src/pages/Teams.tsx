import { UserPlus } from "lucide-react";
import TeamMemberCard from "../components/team/TeamMemberCard";
import { useQuery } from "@tanstack/react-query";
import {
  getTeamMembers,
  getTeamMemberStats,
} from "../services/projectServices";

type TeamTask = {
  id: string;
  status: string;
};
type TeamMember = {
  id: string;
  full_name: string;
  role: string;
  email: string;
  project_members: {
    project_id: string;
  }[];
  tasks: TeamTask[];
};
type TeamMemberStats = {
  id: string;
  project_count: number;
  task_count: number;
  active_task_count: number;
};
function Teams() {
  const {
    data: teamMembers,
    isLoading: isMemberLoading,
    error,
  } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
  });
  const { data: memberStats } = useQuery<TeamMemberStats[]>({
    queryKey: ["team-member-stats"],
    queryFn: getTeamMemberStats,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            People
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Team
          </h1>
        </div>

        {/* <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <UserPlus size={18} />
          Invite member
        </button> */}
      </div>

      {/* Team members */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Team member card */}
        {teamMembers?.map(function (member) {
          const stats = memberStats?.find(function (item) {
            return item.id === member.id;
          });

          let workload = 0;

          if (stats && stats.task_count > 0) {
            workload = Math.round(
              (stats.active_task_count / stats.task_count) * 100,
            );
          }

          return (
            <TeamMemberCard
              key={member.id}
              initials={member.full_name
                .split(" ")
                .map(function (name) {
                  return name[0];
                })
                .join("")
                .toUpperCase()}
              name={member.full_name}
              role={member.role}
              department="Delivery"
              email={member.email}
              projects={stats?.project_count ?? 0}
              tasks={stats?.task_count ?? 0}
              workload={workload}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Teams;
