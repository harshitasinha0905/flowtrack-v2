import { Skeleton } from "../ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="min-h-full px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="rounded-lg border border-slate-200 bg-slate-100 w-75">
            <Skeleton className="h-9 w-36" />
          </div>

          <div className="flex items-center gap-2">
            {/* New project button */}
            <Skeleton className="h-9 w-28 rounded-lg border border-slate-200 bg-slate-100" />

            {/* AI Sprint Summary button */}
            <Skeleton className="h-9 w-40 rounded-lg border border-slate-200 bg-slate-100" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map(function (_, index) {
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-100 p-4"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>

                <div className="mt-4 space-y-2">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          {/* Project completion */}
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-5">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-44" />
            </div>

            <div className="mt-6 flex h-52 gap-3">
              <div className="flex w-8 flex-col justify-between">
                {Array.from({ length: 5 }).map(function (_, index) {
                  return <Skeleton key={index} className="h-3 w-7" />;
                })}
              </div>

              <div className="flex flex-1 items-end gap-3 border-b border-slate-100 px-2">
                {Array.from({ length: 6 }).map(function (_, index) {
                  return (
                    <Skeleton
                      key={index}
                      className="flex-1 rounded-t-md"
                      style={{
                        height: `${35 + index * 8}%`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task status */}
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-5">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-28" />
            </div>

            <div className="mt-5 flex justify-center">
              <Skeleton className="h-36 w-36 rounded-full" />
            </div>

            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map(function (_, index) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-1.5 w-1.5 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>

                    <Skeleton className="h-3 w-5" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent projects + deadlines */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
          {/* Recent projects */}
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-5">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-14" />
            </div>

            <div className="space-y-2">
              {Array.from({ length: 5 }).map(function (_, index) {
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-2.5 py-2"
                  >
                    <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />

                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>

                    <div className="w-40 shrink-0 space-y-2">
                      <Skeleton className="h-1 w-full rounded-full" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-6">
            <Skeleton className="h-6 w-40" />

            <div className="mt-5 space-y-5">
              {Array.from({ length: 4 }).map(function (_, index) {
                return (
                  <div key={index} className="flex items-start gap-4">
                    <Skeleton className="mt-1 h-5 w-5 shrink-0 rounded-md" />

                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-6">
          <Skeleton className="h-6 w-24" />

          <div className="mt-4 space-y-5">
            {Array.from({ length: 5 }).map(function (_, index) {
              return (
                <div key={index} className="flex items-start gap-3">
                  <Skeleton className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
