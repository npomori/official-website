import newsCategories from '@/config/news-category.json'
import React, { useEffect, useRef, useState } from 'react'

interface NewsCategoryDropdownProps {
  id?: string
  selectedCategories: string[]
  onChange: (categories: string[]) => void
  placeholder?: string
}

const NewsCategoryDropdown: React.FC<NewsCategoryDropdownProps> = ({
  id,
  selectedCategories,
  onChange,
  placeholder = 'カテゴリーを選択'
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

  const handleCategoryToggle = (categoryValue: string) => {
    const newCategories = selectedCategories.includes(categoryValue)
      ? selectedCategories.filter((cat) => cat !== categoryValue)
      : [...selectedCategories, categoryValue]
    onChange(newCategories)
  }

  const getSelectedCategoryNames = () => {
    if (selectedCategories.length === 0) return placeholder
    return selectedCategories
      .map((cat) => newsCategories.find((c) => c.value === cat)?.name || cat)
      .join(', ')
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={toggleDropdown}
        className="focus:border-primary-500 focus:ring-primary-500 flex w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-left text-gray-900"
      >
        <span className={`${selectedCategories.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
          {getSelectedCategoryNames()}
        </span>
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
          <div className="max-h-60 overflow-y-auto p-2">
            {newsCategories.map((category) => (
              <label
                key={category.value}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2 hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.value)}
                  onChange={() => handleCategoryToggle(category.value)}
                  className="text-primary-600 focus:ring-primary-500 mr-3 h-4 w-4 rounded border-gray-300"
                />
                <div className="flex items-center">
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-gray-900">{category.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsCategoryDropdown
