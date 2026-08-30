import { ReactNode } from "react";

type SummaryCardProps = {
  label: string;
  value: string;
  description?: string;
  icon: ReactNode;
};

const SummaryCard = ({ label, value, description, icon }: SummaryCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Subtle background decoration */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition-transform duration-300 group-hover:scale-110" />

      <div className="relative flex items-start justify-between gap-4">
        {/* Text */}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>

        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-100">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
