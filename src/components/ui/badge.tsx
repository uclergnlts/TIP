import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
    variant: {
        default:
            "border-transparent bg-slate-700 text-slate-300 hover:bg-slate-600",
        secondary:
            "border-transparent bg-slate-800 text-slate-400 hover:bg-slate-700",
        destructive:
            "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
        outline: "text-slate-400 border-white/10",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20",
    },
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof badgeVariants.variant
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
                badgeVariants.variant[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
