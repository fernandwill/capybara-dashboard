import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-app-primary text-white shadow-sm hover:bg-app-primary-hover",
        secondary:
          "border border-app-border bg-app-card text-app-text-primary hover:bg-app-hover",
        success: "bg-app-success text-white shadow-sm hover:bg-green-600",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
        ghost: "text-app-text-primary hover:bg-app-hover",
        link: "text-app-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 py-1.5 text-sm",
        xs: "h-8 px-3 py-1.5 text-xs",
        lg: "h-11 px-6 py-2.5",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
