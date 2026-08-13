import { IconChevronUp, type TablerIcon } from "@tabler/icons-react";

const accentStyles = {
  green: { icon: "bg-green-500/10 text-app-icon-green" },
  blue: { icon: "bg-blue-500/10 text-app-icon-blue" },
  purple: { icon: "bg-purple-500/10 text-app-icon-purple" },
  orange: { icon: "bg-orange-500/10 text-app-icon-orange" },
} as const;

type Accent = keyof typeof accentStyles;

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
  trend: string;
  icon: TablerIcon;
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

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-app-border bg-app-card p-5 transition-colors hover:border-app-border-hover">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accentStyles[accent].icon}`}>
          <Icon size={18} />
        </div>
        <span className="truncate text-sm font-medium text-app-text-secondary">{label}</span>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex min-w-0 items-baseline gap-1">
          <span className={`truncate text-4xl font-bold tracking-tight text-app-text-primary ${isLoading ? "animate-pulse" : ""}`}>
            {isLoading ? "..." : value}
          </span>
          {suffix && !isLoading && (
            <span className="ml-1 shrink-0 text-xl font-normal text-app-text-secondary">{suffix}</span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-1 pt-3 text-sm">
        {showTrendIcon && <IconChevronUp size={14} className="shrink-0 text-app-success" />}
        <span className="truncate text-app-text-muted">{trend}</span>
      </div>
    </article>
  );
}
