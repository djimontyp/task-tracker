import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/shared/lib/index"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] disabled:shadow-none disabled:bg-primary/40",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg active:scale-[0.98] disabled:shadow-none disabled:bg-destructive/40",
        outline:
          "border-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 active:scale-[0.98] disabled:bg-background/50 disabled:text-muted-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-[0.98] disabled:shadow-none disabled:bg-secondary/40",
        ghost:
          "border border-border/60 bg-background/30 text-foreground hover:bg-accent hover:text-accent-foreground hover:border-foreground/40 active:bg-accent/80 active:scale-[0.98] aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:border-primary/70 aria-pressed:hover:bg-primary/90 disabled:bg-transparent disabled:text-muted-foreground disabled:border-border/25",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline active:text-primary/80 disabled:no-underline disabled:text-primary/50",
      },
      size: {
        default: "h-9 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5 text-base",
        icon: "h-9 w-9 p-0",
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
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
