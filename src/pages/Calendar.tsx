import { useState } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCalendarTasks } from "../services/taskServices";
import { useNavigate } from "react-router-dom";

function getTaskStatusColor(status: string) {
  switch (status) {
    case "todo":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "in_progress":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "review":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "done":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["calendar-tasks"],
    queryFn: getCalendarTasks,
  });

  const navigate = useNavigate();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  function goToPreviousMonth() {
    setCurrentMonth(subMonths(currentMonth, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(addMonths(currentMonth, 1));
  }

  function goToToday() {
    setCurrentMonth(new Date());
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {Array.from({ length: 35 }).map(function renderSkeleton(_, index) {
            return (
              <div
                key={index}
                className="min-h-24 border-b border-r border-slate-100 p-3"
              >
                <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">
          Unable to load calendar tasks.
        </p>
        <p className="mt-1 text-sm text-red-600">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep track of task deadlines across your projects.
          </p>
        </div>

        <button
          type="button"
          onClick={goToToday}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <CalendarDays size={16} />
          Today
        </button>
      </div>

      {/* Calendar */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Month navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {format(currentMonth, "MMMM yyyy")}
          </h2>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>

        {/* Weekday headings */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            function renderWeekday(day) {
              return (
                <div
                  key={day}
                  className="px-1 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-3"
                >
                  {day}
                </div>
              );
            },
          )}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map(function renderDay(day) {
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 border-b border-r border-slate-100 p-1.5 sm:min-h-28 sm:p-3 ${
                  !inCurrentMonth ? "bg-slate-50/70" : "bg-white"
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    today
                      ? "bg-violet-600 text-white"
                      : inCurrentMonth
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-2 space-y-1">
                  {tasks
                    .filter(function filterTasksByDate(task) {
                      return (
                        task.due_date && isSameDay(new Date(task.due_date), day)
                      );
                    })
                    .map(function renderTask(task) {
                      return (
                        <button
                          key={task.id}
                          title={`${task.title} · ${task.projects?.[0]?.name ?? "No project"}`}
                          onClick={function handleTaskClick() {
                            navigate(`/projects/${task.project_id}`, {
                              state: {
                                openTaskId: task.id,
                              },
                            });
                          }}
                          className={`block w-full min-w-0 overflow-hidden cursor-pointer rounded-md border px-1.5 py-1 text-left text-[10px] font-medium leading-4 transition-opacity hover:opacity-75 sm:px-2 sm:text-xs ${getTaskStatusColor(task.status)}`}
                        >
                          <span className="block truncate">{task.title}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        {[
          { label: "To do", color: "bg-blue-500" },
          { label: "In progress", color: "bg-amber-500" },
          { label: "In review", color: "bg-violet-500" },
          { label: "Completed", color: "bg-emerald-500" },
        ].map(function renderLegendItem(item) {
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <span className="text-xs font-medium text-slate-600">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
