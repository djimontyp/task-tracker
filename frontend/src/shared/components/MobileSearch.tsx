import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet'
import { SearchBar } from '@/features/search/components'

interface MobileSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MobileSearch = ({ open, onOpenChange }: MobileSearchProps) => {
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
          <SearchBar />
        </div>
      </SheetContent>
    </Sheet>
  )
}
