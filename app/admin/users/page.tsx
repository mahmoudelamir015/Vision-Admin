"use client";

import { useState } from "react";
import { Search, ShieldAlert, CircleDashed } from "lucide-react";
import { useAuth } from "@/components/admin/AuthContext";
import EmptyState from "@/components/admin/EmptyState";

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "master_admin";
  const [search, setSearch] = useState("");

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2rem] border border-dashed border-red-200 bg-red-50 p-8 text-center text-red-600">
        <ShieldAlert className="mb-3 h-14 w-14 opacity-70" />
        <h2 className="text-xl font-extrabold">ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط¯ط®ظˆظ„ ط§ظ„ط·ظ„ط§ط¨</h2>
        <p className="mt-2 max-w-md text-sm font-bold leading-6">ط§ظ„طµظپط­ط© ظ…ط­ظ…ظٹط© ظ„ظ„ظ…ط¯ظٹط± ظپظ‚ط·.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0A2540]/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">ط¥ط¯ط§ط±ط© ط§ظ„ط·ظ„ط§ط¨</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
              ط§ظ„طµظپط­ط© ط¬ط§ظ‡ط²ط© ظ„ط§ط³طھظ‚ط¨ط§ظ„ ظ…ظ„ظپط§طھ ط§ظ„ط·ظ„ط§ط¨ ط§ظ„ط­ظ‚ظٹظ‚ظٹط© ظ…ظ† Supabase.
            </p>
          </div>
          <div className="relative lg:w-80">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ط¨ط­ط« ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ظƒظˆط¯ ط£ظˆ ط§ظ„ظ‡ط§طھظپ"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition-colors focus:border-[#D4AF37] dark:border-white/10 dark:bg-black/20"
            />
          </div>
        </div>
      </div>

      <EmptyState
        icon={CircleDashed}
        title="ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ط·ظ„ط§ط¨ ط­ط§ظ„ظٹط§ظ‹"
        description="ظ‡ظ†ط§ ظ‡ظ†ط±ط¨ط· ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط§ظ…ظ„ ظ„ظ„ط·ط§ظ„ط¨طŒ ظˆط§ظ„ظ…ظˆط¨ط§ظٹظ„طŒ ظˆط§ظ„ظ…ط±ط§ط­ظ„طŒ ظˆط§ظ„ظ…ط³طھظˆظٹط§طھ ط¨ط¹ط¯ ط¥ظ†ط´ط§ط، ط§ظ„ط¬ط¯ط§ظˆظ„ ط§ظ„ط­ظ‚ظٹظ‚ظٹط©."
      />
    </div>
  );
}

