import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
    variant: {
        default: "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-orange-500/20 border-0",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white",
        secondary: "bg-slate-800 text-white hover:bg-slate-700",
        ghost: "hover:bg-white/5 hover:text-white text-slate-400",
        link: "text-blue-400 underline-offset-4 hover:underline",
    },
    size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    },
}

interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof buttonVariants.variant
    size?: keyof typeof buttonVariants.size
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50",
                    buttonVariants.variant[variant],
                    buttonVariants.size[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
