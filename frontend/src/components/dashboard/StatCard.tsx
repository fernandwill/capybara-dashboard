import { TrendingUp, type LucideIcon } from "lucide-react";

const accentStyles = {
  green: { icon: "bg-emerald-500/20 text-emerald-400" },
  blue: { icon: "bg-blue-500/20 text-blue-400" },
  purple: { icon: "bg-violet-500/20 text-violet-400" },
  orange: { icon: "bg-orange-500/20 text-orange-400" },
} as const;

type Accent = keyof typeof accentStyles;

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
  trend: string;
  icon: LucideIcon;
  accent?: Accent;
  isLoading?: boolean;
  showTrendIcon?: boolean;
}

export default function StatCard({
  label,
  value,
  suffix,
  trend,
  icon,
  accent = "green",
  isLoading = false,
  showTrendIcon = true,
}: StatCardProps) {
  const Icon = icon;
  const accentClass = accentStyles[accent].icon;

  return (
    <div className="flex min-h-[170px] flex-col rounded-xl border border-white/[0.1] bg-[#141515] p-6 transition-colors hover:border-white/[0.2]">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClass}`}
        >
          <Icon size={21} />
        </div>

        <span className="text-sm text-white/60">{label}</span>
      </div>

      <div className="mt-6 flex items-baseline gap-1">
        <span
          className={`text-4xl font-semibold tracking-tight ${
            isLoading ? "animate-pulse" : ""
          }`}
        >
          {isLoading ? "..." : value}
        </span>

        {suffix && !isLoading && (
          <span className="text-sm text-white/50">{suffix}</span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-emerald-400">
        {showTrendIcon && <TrendingUp size={13} className="shrink-0" />}
        <span className="truncate">{trend}</span>
      </div>
    </div>
  );
}
