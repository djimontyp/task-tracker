import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="h-auto"
        aria-label={t('mobileSearch.title')}
      >
        <SheetHeader>
          <SheetTitle className="sr-only">{t('mobileSearch.title')}</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
