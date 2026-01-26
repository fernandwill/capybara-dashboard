import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 hover:shadow-md active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:transition-all [&_svg]:duration-200 [&_svg]:pointer-events-none',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                primary: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border border-white/20 shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-blue-800 rounded-xl',
                success: 'bg-gradient-to-br from-green-500 to-green-700 text-white border border-white/20 shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-green-800 rounded-xl',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline hover:shadow-none hover:translate-y-0',
                warning: 'bg-yellow-600 text-white hover:bg-yellow-600/90',
                info: 'bg-blue-600 text-white hover:bg-blue-600/90',
            },
            size: {
                default: 'h-10 px-4 py-2',
                xs: 'h-7 rounded-md px-2 text-xs',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                xl: 'h-12 rounded-md px-10 text-base',
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