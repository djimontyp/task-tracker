import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/index"
import { ButtonProps, buttonVariants } from "@/shared/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => {
  const { t } = useTranslation("common")
  return (
    <nav
      role="navigation"
      aria-label={t("pagination.ariaLabel")}
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-2", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
  asChild?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  asChild = false,
  size = "icon",
  ...props
}: PaginationLinkProps) => {
  const Comp = asChild ? Slot : "a"
  return (
    <Comp
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props}
    />
  )
}
PaginationLink.displayName = "PaginationLink"

type PaginationPreviousProps = {
  asChild?: boolean
} & Omit<React.ComponentProps<typeof PaginationLink>, "asChild">

const PaginationPrevious = ({
  className,
  asChild = false,
  ...props
}: PaginationPreviousProps) => {
  const { t } = useTranslation("common")
  return (
    <PaginationLink
      aria-label={t("pagination.goToPrevious")}
      size="default"
      className={cn("gap-2 pl-2.5", className)}
      asChild={asChild}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{t("pagination.previous")}</span>
    </PaginationLink>
  )
}
PaginationPrevious.displayName = "PaginationPrevious"

type PaginationNextProps = {
  asChild?: boolean
} & Omit<React.ComponentProps<typeof PaginationLink>, "asChild">

const PaginationNext = ({
  className,
  asChild = false,
  ...props
}: PaginationNextProps) => {
  const { t } = useTranslation("common")
  return (
    <PaginationLink
      aria-label={t("pagination.goToNext")}
      size="default"
      className={cn("gap-2 pr-2.5", className)}
      asChild={asChild}
      {...props}
    >
      <span>{t("pagination.next")}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => {
  const { t } = useTranslation("common")
  return (
    <span
      aria-hidden
      className={cn("flex h-11 w-11 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">{t("pagination.morePages")}</span>
    </span>
  )
}
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
