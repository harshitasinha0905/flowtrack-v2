import { Bell, Search, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Header() {
  const { user } = useAuth();

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
          placeholder="Search projects, tasks, people..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-[rgb(250,250,250)] pl-10.25 pr-16 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        />

        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-sm text-slate-400">
          <span className="text-base">⌘</span>
          <span>K</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-7">
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-purple-500 px-4 text-[14px] font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-purple-600 cursor-pointer"
        >
          <Sparkles size={18} />
          AI Task Breakdown
        </button>

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
