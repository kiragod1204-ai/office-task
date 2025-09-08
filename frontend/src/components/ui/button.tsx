import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-[hsl(var(--gradient-end))] text-primary-foreground hover:from-primary/90 hover:to-[hsl(var(--gradient-end))]/90 shadow-primary/25 hover:shadow-primary/40",
        destructive:
          "bg-gradient-to-r from-destructive to-red-700 text-destructive-foreground hover:from-destructive/90 hover:to-red-800 shadow-destructive/25 hover:shadow-destructive/40",
        outline:
          "border-2 border-border bg-background/80 backdrop-blur-sm hover:bg-accent hover:border-primary hover:text-primary shadow-sm",
        secondary:
          "bg-gradient-to-r from-secondary to-accent text-secondary-foreground hover:from-secondary/90 hover:to-accent/90 shadow-secondary/10",
        ghost: "hover:bg-gradient-to-r hover:from-primary/10 hover:to-[hsl(var(--gradient-end))]/10 hover:text-primary shadow-none hover:shadow-md",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/90 shadow-none",
        success: "bg-gradient-to-r from-[hsl(var(--gradient-success-start))] to-[hsl(var(--gradient-success-end))] text-white hover:from-[hsl(var(--gradient-success-start))]/90 hover:to-[hsl(var(--gradient-success-end))]/90 shadow-green-500/25 hover:shadow-green-500/40",
        warning: "bg-gradient-to-r from-[hsl(var(--gradient-warning-start))] to-[hsl(var(--gradient-warning-end))] text-white hover:from-[hsl(var(--gradient-warning-start))]/90 hover:to-[hsl(var(--gradient-warning-end))]/90 shadow-amber-500/25 hover:shadow-amber-500/40",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }