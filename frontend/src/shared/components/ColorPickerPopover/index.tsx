import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: color }}
          disabled={disabled}
          aria-label="Pick color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-3">
        <div className="space-y-2">
          <HexColorPicker color={tempColor} onChange={setTempColor} />
          <Input
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            placeholder="#RRGGBB"
            className="font-mono text-xs"
            maxLength={7}
            aria-label="Hex color code"
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
            🎯 Auto-pick
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1" type="button">
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
