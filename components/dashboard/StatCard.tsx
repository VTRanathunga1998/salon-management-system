import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
  accent: string; // tailwind bg-* class, e.g. "bg-violet-500"
  description: string;
  prefix?: string; // e.g. "AED " for currency values
};

const StatCard = ({
  title,
  value,
  icon,
  accent,
  description,
  prefix,
}: StatCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-sm transition">
      <div
        className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 ${accent}`}
      />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-xl md:text-3xl font-black text-slate-800">
            {prefix}
            {value.toLocaleString(
              undefined,
              prefix
                ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                : undefined,
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} bg-opacity-15 text-slate-700`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
