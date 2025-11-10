import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowPathIcon } from "@heroicons/react/24/outline"

import { cn } from "@/shared/lib/index"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-accent/30 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:border-accent hover:shadow-[0_0_12px_rgba(244,133,73,0.4)] active:scale-[0.98] disabled:from-primary/40 disabled:to-accent/40 disabled:border-transparent disabled:shadow-none",
        destructive:
          "border border-destructive/40 bg-gradient-to-r from-destructive via-destructive to-[hsl(353,84%,38%)] text-destructive-foreground hover:border-destructive hover:shadow-[0_0_8px_rgba(215,38,56,0.5)] active:scale-[0.98] disabled:from-destructive/40 disabled:to-destructive/40 disabled:border-transparent disabled:shadow-none",
        outline:
          "border border-border/60 bg-background text-foreground hover:bg-accent/10 hover:border-accent/50 hover:text-accent-foreground active:scale-[0.98] disabled:bg-background/50 disabled:text-muted-foreground disabled:border-border/30",
        secondary:
          "border border-[hsl(17,45%55%)] bg-secondary text-secondary-foreground hover:border-[hsl(17,50%,60%)] hover:shadow-[0_0_8px_rgba(201,126,99,0.3)] active:scale-[0.98] disabled:bg-secondary/40 disabled:border-transparent disabled:shadow-none",
        ghost:
          "border border-border/50 bg-gradient-to-b from-background to-muted/20 text-foreground hover:border-accent/40 hover:from-accent/5 hover:to-accent/10 active:scale-[0.98] aria-pressed:border-primary aria-pressed:from-primary aria-pressed:to-accent aria-pressed:text-primary-foreground aria-pressed:shadow-[0_0_8px_rgba(244,133,73,0.3)] disabled:from-transparent disabled:to-transparent disabled:text-muted-foreground disabled:border-border/25",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline active:text-primary/80 disabled:no-underline disabled:text-primary/50",
      },
      size: {
        default: "h-10 md:h-11 px-4 text-sm",
        sm: "h-9 md:h-10 px-3 text-xs",
        lg: "h-11 md:h-12 px-5 text-sm",
        icon: "h-10 w-10 md:h-11 md:w-11 p-0",
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
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <ArrowPathIcon className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
