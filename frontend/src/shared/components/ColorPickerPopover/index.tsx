import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Paintbrush } from 'lucide-react'

interface ColorPickerPopoverProps {
  color: string
  onColorChange: (color: string) => void
  onAutoPickClick: () => void
  disabled?: boolean
}

export const ColorPickerPopover = ({
  color,
  onColorChange,
  onAutoPickClick,
  disabled = false,
}: ColorPickerPopoverProps) => {
  const { t } = useTranslation('common')
  const [tempColor, setTempColor] = useState(color)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    onColorChange(tempColor)
    setIsOpen(false)
  }

  const handleAutoPickAndClose = () => {
    onAutoPickClick()
    setIsOpen(false)
  }

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex items-center justify-center w-10 h-10 rounded-md border-2 border-border hover:border-primary/50 hover:bg-accent/10 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 group"
                disabled={disabled}
                aria-label={t('colorPicker.changeTopicColor')}
              >
                <div
                  className="w-6 h-6 rounded-full border border-border/50"
                  style={{ backgroundColor: color }}
                />
                <Paintbrush className="absolute -bottom-2 -right-2 w-4 h-4 text-primary bg-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('colorPicker.changeColor')}</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-64 p-4 space-y-4">
        <div className="space-y-2">
          <HexColorPicker color={tempColor} onChange={setTempColor} />
          <Input
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            placeholder="#RRGGBB"
            className="font-mono text-xs"
            maxLength={7}
            aria-label={t('colorPicker.hexColorCode')}
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoPickAndClose}
            className="flex-1"
            type="button"
          >
            {t('colorPicker.autoPick')}
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1" type="button">
            {t('colorPicker.save')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    </TooltipProvider>
  )
}
