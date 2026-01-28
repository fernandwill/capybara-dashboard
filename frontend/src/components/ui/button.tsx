import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
    'inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 hover:-translate-y-[1px] active:translate-y-[1px] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg',
                primary: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border border-blue-500/20 shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/40',
                success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border border-emerald-500/20 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/40',
                destructive: 'bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-500/20 shadow-lg shadow-red-500/20 hover:from-red-500 hover:to-red-600 hover:shadow-red-500/40',
                outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
                ghost: 'hover:bg-accent/50 hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80',
                warning: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-500/20 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/40',
                info: 'bg-gradient-to-br from-sky-500 to-sky-600 text-white border border-sky-500/20 shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 hover:shadow-sky-500/40',
                premium: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border border-white/20 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:brightness-110',
                glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-foreground shadow-sm hover:bg-white/20 hover:shadow-md',
            },
            size: {
                default: 'h-10 px-5 py-2',
                xs: 'h-7 px-2 text-xs',
                sm: 'h-9 px-3',
                lg: 'h-12 px-8 text-base',
                xl: 'h-14 rounded-2xl px-10 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'

export { Button, buttonVariants }