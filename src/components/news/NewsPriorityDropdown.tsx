import newsPriority from '@/config/news-priority.json'
import React, { useEffect, useRef, useState } from 'react'

interface NewsPriorityDropdownProps {
  id?: string
  selectedPriority: string | null
  onChange: (priority: string | null) => void
  placeholder?: string
}

const NewsPriorityDropdown: React.FC<NewsPriorityDropdownProps> = ({
  id,
  selectedPriority,
  onChange,
  placeholder = '優先度を選択'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handlePrioritySelect = (priorityValue: string) => {
    const newPriority = selectedPriority === priorityValue ? null : priorityValue
    onChange(newPriority)
    setIsOpen(false)
  }

  const getSelectedPriorityName = () => {
    if (!selectedPriority) return placeholder
    const priority = newsPriority.find((p) => p.value === selectedPriority)
    return priority ? priority.name : selectedPriority
  }

  const getSelectedPriorityColor = () => {
    if (!selectedPriority) return '#6B7280'
    const priority = newsPriority.find((p) => p.value === selectedPriority)
    return priority ? priority.color : '#6B7280'
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={toggleDropdown}
        className="focus:border-primary-500 focus:ring-primary-500 flex w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-left text-gray-900"
      >
        <div className="flex items-center">
          {selectedPriority && (
            <div
              className="mr-2 h-3 w-3 rounded-full"
              style={{ backgroundColor: getSelectedPriorityColor() }}
            ></div>
          )}
          <span className={selectedPriority ? 'text-gray-900' : 'text-gray-500'}>
            {getSelectedPriorityName()}
          </span>
        </div>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <button
              onClick={() => handlePrioritySelect('')}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left hover:bg-gray-100"
            >
              <span className="text-gray-500">優先度なし</span>
            </button>
            {newsPriority.map((priority) => (
              <button
                key={priority.value}
                onClick={() => handlePrioritySelect(priority.value)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left hover:bg-gray-100"
              >
                <div
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: priority.color }}
                ></div>
                <span className="text-gray-900">{priority.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsPriorityDropdown
