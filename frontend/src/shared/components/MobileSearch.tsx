import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet'

interface MobileSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export const MobileSearch = ({ open, onOpenChange, children }: MobileSearchProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="h-auto"
        aria-label="Mobile search"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">Search</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
