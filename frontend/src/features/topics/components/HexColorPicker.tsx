import React, { useState } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import { Button } from '@/shared/ui'

interface HexColorPickerComponentProps {
  selectedColor?: string | null
  onColorChange: (color: string) => void
  className?: string
}

const HexColorPickerComponent: React.FC<HexColorPickerComponentProps> = ({
  selectedColor,
  onColorChange,
  className = ''
}) => {
  const [color, setColor] = useState<string>(selectedColor || '#6b7280')
  const [isValidHex, setIsValidHex] = useState<boolean>(true)

  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    setIsValidHex(true)
    onColorChange(newColor)
  }

  const handleInputChange = (newColor: string) => {
    setColor(newColor)

    // Validate hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (newColor === '' || hexRegex.test(newColor)) {
      setIsValidHex(true)
      if (newColor !== '') {
        onColorChange(newColor)
      }
    } else {
      setIsValidHex(false)
    }
  }

  const handlePresetColor = (presetColor: string) => {
    setColor(presetColor)
    setIsValidHex(true)
    onColorChange(presetColor)
  }

  const presetColors = [
    '#dc2626', // red
    '#ea580c', // orange
    '#d97706', // amber
    '#ca8a04', // yellow
    '#84cc16', // lime
    '#16a34a', // green
    '#059669', // emerald
    '#0d9488', // teal
    '#0891b2', // cyan
    '#0ea5e9', // sky
    '#2563eb', // blue
    '#4f46e5', // indigo
    '#7c3aed', // violet
    '#9333ea', // purple
    '#c026d3', // fuchsia
    '#db2777', // pink
    '#e11d48', // rose
    '#6b7280', // gray
    '#64748b', // slate
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Color Picker */}
      <div className="flex justify-center">
        <div className="react-colorful-wrapper">
          <HexColorPicker
            color={color}
            onChange={handleColorChange}
            style={{
              width: '100%',
              height: '200px',
              maxWidth: '280px'
            }}
          />
        </div>
      </div>

      {/* Color Input */}
      <div className="space-y-2">
        <label htmlFor="hex-input" className="block text-sm font-medium text-gray-700">
          Hex Color Code
        </label>
        <div className="relative">
          <HexColorInput
            id="hex-input"
            color={color}
            onChange={handleInputChange}
            prefixed
            placeholder="#000000"
            className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${
              isValidHex
                ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
            }`}
            style={{ fontFamily: 'monospace' }}
          />
          <div
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded border-2 border-gray-300"
            style={{ backgroundColor: color }}
          />
        </div>
        {!isValidHex && (
          <p className="text-xs text-red-600">Please enter a valid hex color (e.g., #FF5733)</p>
        )}
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Quick Select</p>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => handlePresetColor(presetColor)}
              className={`
                h-8 w-8 rounded-full border-2 transition-all duration-200
                hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${color === presetColor
                  ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400'
                  : 'border-gray-300 hover:border-gray-500'
                }
              `}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
              aria-label={`Select ${presetColor} color`}
            />
          ))}
        </div>
      </div>

      {/* Current Color Display */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border-2 border-gray-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'monospace' }}>
            {color.toUpperCase()}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigator.clipboard.writeText(color)}
          className="text-xs"
        >
          Copy
        </Button>
      </div>
    </div>
  )
}

export default HexColorPickerComponent