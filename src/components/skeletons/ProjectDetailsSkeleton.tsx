import { Skeleton } from "../ui/skeleton";

function ProjectDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back */}
      <Skeleton className="h-5 w-20 bg-slate-100" />

      {/* Project header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Project avatar */}
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl bg-slate-100" />

          {/* Project information */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-56 bg-slate-100" />

            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28 bg-slate-100" />
              <Skeleton className="h-3 w-3 rounded-full bg-slate-100" />
              <Skeleton className="h-5 w-14 rounded-full bg-slate-100" />
              <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>

        {/* AI Sprint Summary */}
        <Skeleton className="h-10 w-40 rounded-lg bg-slate-100" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map(function (_, index) {
          return (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-slate-100 p-5"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-8 w-14" />
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-6">
          {Array.from({ length: 6 }).map(function (_, index) {
            return <Skeleton key={index} className="h-5 w-14 rounded-sm" />;
          })}
        </div>
      </div>

      {/* Overview content */}
      <div className="rounded-xl border border-slate-200 bg-slate-100 p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-5/6 max-w-2xl" />
          <Skeleton className="h-4 w-2/3 max-w-xl" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(function (_, index) {
            return (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsSkeleton;
