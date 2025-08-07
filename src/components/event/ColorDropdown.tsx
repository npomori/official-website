import colors from '@/config/event-category.json'
import React, { useState } from 'react'

interface ColorDropdownProps {
  id: string
  selectedIndex: string
  onChange: (value: string) => void
}

const ColorDropdown: React.FC<ColorDropdownProps> = ({ id, selectedIndex, onChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleSelect = (value: string) => {
    onChange(value)
    setIsOpen(false)
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const selectedColor = colors.find((color) => color.value === selectedIndex)

  return (
    <>
      <div className="focus:border-primary-500 focus:ring-primary-500 relative mt-1 block w-full rounded-lg border border-gray-300 shadow-sm">
        <button
          type="button"
          id={id}
          className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left"
          style={{
            backgroundColor: selectedColor?.color || 'white',
            color: selectedColor ? 'white' : 'black'
          }}
          onClick={toggleDropdown}
        >
          <span>{selectedColor?.name || '-- Select a color --'}</span>
          <svg
            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute top-full z-10 mt-1 w-full rounded-md bg-white shadow-lg">
            {colors.map((color) => (
              <div
                key={color.value}
                className="cursor-pointer px-3 py-2.5 hover:bg-gray-200"
                style={{ backgroundColor: color.color, color: 'white' }}
                onClick={() => handleSelect(color.value)}
              >
                {color.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default ColorDropdown
