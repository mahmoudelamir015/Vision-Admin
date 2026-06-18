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
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0A2540]/40">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0A2540]/5 text-[#0A2540] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-2xl font-extrabold text-[#0A2540] dark:text-white">{title}</h3>
      <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-[#0A2540] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#123B66] dark:bg-[#D4AF37] dark:text-[#0A2540] dark:hover:bg-[#e3c05b]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
