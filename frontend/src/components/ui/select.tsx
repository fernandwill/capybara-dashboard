import React from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

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
            "flex h-10 w-full appearance-none rounded-xl border border-[#282c35] bg-[#12151c] px-3.5 py-2 pr-9 text-sm text-gray-200 shadow-sm transition-colors hover:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
