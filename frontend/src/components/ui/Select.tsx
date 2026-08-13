import React from "react";
import { cn } from "../../lib/utils";
import { IconChevronDown } from "@tabler/icons-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative inline-block w-full", wrapperClassName)}>
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border border-app-border bg-app-input px-3.5 py-2 pr-9 text-base sm:text-sm text-app-text-primary shadow-sm transition-colors hover:border-app-border-hover focus:border-app-primary focus:outline-none focus:ring-1 focus:ring-app-primary disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <IconChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted"
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
