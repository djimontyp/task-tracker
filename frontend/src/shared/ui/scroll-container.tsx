import * as React from "react"
import { ScrollArea } from "./scroll-area"
import { cn } from "@/shared/lib/utils"

type ScrollVariant = 'native' | 'radix'

interface ScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Scroll implementation strategy:
   * - 'native': Browser overflow-auto (better for backdrop-filter, Firefox compat)
   * - 'radix': Radix ScrollArea (custom scrollbar styling)
   * @default 'native'
   */
  variant?: ScrollVariant
  children: React.ReactNode
}

/**
 * Polymorphic scroll container with strategy switching.
 *
 * Use 'native' when:
 * - Need backdrop-filter/blur inside (Firefox bug with Radix)
 * - Better performance needed
 * - Sticky elements inside
 *
 * Use 'radix' when:
 * - Need custom scrollbar styling
 * - Consistent cross-browser scrollbar appearance
 */
const ScrollContainer = React.forwardRef<HTMLDivElement, ScrollContainerProps>(
  ({ variant = 'native', className, children, dir, ...props }, ref) => {
    if (variant === 'radix') {
      // Cast dir to Direction type expected by Radix ScrollArea
      const direction = dir as "ltr" | "rtl" | undefined
      return (
        <ScrollArea ref={ref} className={cn("h-full", className)} dir={direction} {...props}>
          {children}
        </ScrollArea>
      )
    }

    // Native scroll - works with backdrop-filter in all browsers
    return (
      <div
        ref={ref}
        dir={dir}
        className={cn(
          "h-full overflow-auto",
          // Custom scrollbar styling to match Radix appearance
          "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ScrollContainer.displayName = "ScrollContainer"

export { ScrollContainer, type ScrollContainerProps, type ScrollVariant }
