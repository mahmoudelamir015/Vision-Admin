'use client';

import { AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white/70 p-5 text-center shadow-sm backdrop-blur-xl sm:p-6 border-slate-200 bg-white shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-extrabold text-[#0A2540] sm:text-xl text-[#0A2540]">{title}</h3>
      <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-slate-500 text-slate-500">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 w-full rounded-xl bg-[#0A2540] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#123B66] sm:w-auto sm:px-5 dark:bg-[#D4AF37] dark:text-[#0A2540] dark:hover:bg-[#e3c05b]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
