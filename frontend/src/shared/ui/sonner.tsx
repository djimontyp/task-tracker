"use client"

import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toast duration in milliseconds.
 * Set to 5 seconds for better readability.
 */
const TOAST_DURATION_MS = 5000

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={TOAST_DURATION_MS}
      icons={{
        success: <CheckCircle className="h-5 w-5 text-semantic-success" />,
        error: <AlertCircle className="h-5 w-5 text-semantic-error" />,
        warning: <AlertTriangle className="h-5 w-5 text-semantic-warning" />,
        info: <Info className="h-5 w-5 text-semantic-info" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-semantic-success group-[.toaster]:bg-background",
          error:
            "group-[.toaster]:border-semantic-error group-[.toaster]:bg-background",
          warning:
            "group-[.toaster]:border-semantic-warning group-[.toaster]:bg-background",
          info:
            "group-[.toaster]:border-semantic-info group-[.toaster]:bg-background",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
