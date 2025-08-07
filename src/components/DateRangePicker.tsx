import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import { ja } from 'date-fns/locale'
import React, { forwardRef, useEffect, useState } from 'react'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange?: (startDate: Date | null, endDate: Date | null) => void
  isRangeMode?: boolean // 日付範囲選択モードかどうかを指定するプロパティ
  placeholder?: string // プレースホルダーテキスト
  showWeekday?: boolean // 曜日を表示するかどうかを指定するプロパティ
}

const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      startDate: externalStartDate,
      endDate: externalEndDate,
      onChange,
      isRangeMode = true, // デフォルトは日付範囲選択モード
      placeholder = '日付を選択',
      showWeekday = false
    },
    ref
  ) => {
    // 内部で状態を管理
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [isSelecting, setIsSelecting] = useState(false)
    const [calendarVisible, setCalendarVisible] = useState(false)
    const [internalStartDate, setInternalStartDate] = useState<Date | null>(externalStartDate)
    const [internalEndDate, setInternalEndDate] = useState<Date | null>(externalEndDate)

    // 外部から渡されたpropsが変更された場合に内部状態を更新
    useEffect(() => {
      setInternalStartDate(externalStartDate)
      setInternalEndDate(externalEndDate)
    }, [externalStartDate, externalEndDate])

    // カレンダーを表示するときに、開始日が設定されていれば開始日が表示できる月を表示
    useEffect(() => {
      if (calendarVisible && internalStartDate) {
        setCurrentMonth(internalStartDate)
      }
    }, [calendarVisible, internalStartDate])

    const handlePrevMonth = () => {
      setCurrentMonth(subMonths(currentMonth, 1))
    }

    const handleNextMonth = () => {
      setCurrentMonth(addMonths(currentMonth, 1))
    }

    const handleDateClick = (day: Date) => {
      if (isRangeMode) {
        // 日付範囲選択モード
        if (!isSelecting) {
          setInternalStartDate(day)
          setInternalEndDate(null)
          setIsSelecting(true)
          if (onChange) onChange(day, null)
        } else {
          if (internalStartDate && isBefore(day, internalStartDate)) {
            setInternalStartDate(day)
            setInternalEndDate(internalStartDate)
            if (onChange) onChange(day, internalStartDate)
          } else if (internalStartDate) {
            setInternalEndDate(day)
            if (onChange) onChange(internalStartDate, day)
          }
          setIsSelecting(false)
        }
      } else {
        // 単一日付選択モード
        setInternalStartDate(day)
        setInternalEndDate(day)
        if (onChange) onChange(day, day)
        setCalendarVisible(false)
        // カレンダーが閉じられた後にフォーカスを復元
        setTimeout(() => {
          if (ref && typeof ref === 'object' && ref.current) {
            const button = ref.current.querySelector('button')
            button?.focus()
          }
        }, 10)
      }
    }

    // ヘッダー（月表示と前後ナビゲーション）をレンダリング
    const renderHeader = () => {
      return (
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-full p-1 hover:bg-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'yyyy年 MMMM', { locale: ja })}
          </h2>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-full p-1 hover:bg-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )
    }

    // 曜日の行をレンダリング
    const renderDays = () => {
      const weekdays = ['日', '月', '火', '水', '木', '金', '土']
      return (
        <div className="mb-2 grid grid-cols-7">
          {weekdays.map((day, index) => (
            <div
              key={day}
              className={`py-2 text-center text-sm font-medium ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      )
    }

    const renderCells = () => {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(monthStart)
      const startDate1 = startOfWeek(monthStart)
      const endDate1 = endOfWeek(monthEnd)

      const dateFormat = 'd'
      const rows = []
      let days = []
      let day = startDate1

      while (day <= endDate1) {
        for (let i = 0; i < 7; i++) {
          const cloneDay = day
          const isCurrentMonth =
            isSameDay(day, monthStart) ||
            (isAfter(day, monthStart) && isBefore(day, endOfMonth(monthStart)))

          const isStartDate = internalStartDate && isSameDay(day, internalStartDate)
          const isEndDate = internalEndDate && isSameDay(day, internalEndDate)
          const isInRange =
            internalStartDate &&
            internalEndDate &&
            isWithinInterval(day, { start: internalStartDate, end: internalEndDate })
          const isCurrentDay = isToday(day)
          const isSunday = getDay(day) === 0
          const isSaturday = getDay(day) === 6
          const isSameDaySelected =
            internalStartDate &&
            internalEndDate &&
            isSameDay(internalStartDate, internalEndDate) &&
            isSameDay(day, internalStartDate)

          days.push(
            <div
              key={day.toString()}
              className={`relative cursor-pointer p-2 text-center transition-colors duration-200 ${
                !isCurrentMonth ? 'text-gray-400' : ''
              } ${
                isSameDaySelected
                  ? 'bg-primary-600 rounded-full text-white'
                  : isStartDate
                    ? 'bg-primary-600 rounded-l-full text-white'
                    : isEndDate
                      ? 'bg-primary-600 rounded-r-full text-white'
                      : ''
              } ${isInRange && !isStartDate && !isEndDate ? 'bg-primary-100' : ''} ${
                isCurrentMonth && !isStartDate && !isEndDate && !isInRange
                  ? 'hover:bg-primary-50'
                  : ''
              } ${isCurrentDay && !isStartDate && !isEndDate ? 'border-b-2 border-red-500 font-bold' : ''}`}
              onClick={() => isCurrentMonth && handleDateClick(cloneDay)}
            >
              <span
                className={`block ${isStartDate || isEndDate ? 'font-semibold' : ''} ${
                  !isCurrentMonth
                    ? 'text-gray-400'
                    : isSunday
                      ? 'text-red-500'
                      : isSaturday
                        ? 'text-blue-500'
                        : ''
                }`}
              >
                {format(day, dateFormat)}
              </span>
            </div>
          )
          day = addDays(day, 1)
        }
        rows.push(
          <div key={day.toString()} className="grid grid-cols-7 gap-0">
            {days}
          </div>
        )
        days = []
      }
      return <div className="mb-2">{rows}</div>
    }

    const formatDateDisplay = (date: Date | null) => {
      if (!date) return '選択してください'

      const baseFormat = format(date, 'yyyy年M月d日', { locale: ja })

      if (showWeekday) {
        const weekday = format(date, 'E', { locale: ja })
        return `${baseFormat}(${weekday})`
      }

      return baseFormat
    }

    return (
      <div ref={ref} className="relative">
        <div>
          <button
            type="button"
            onClick={() => setCalendarVisible(!calendarVisible)}
            className="focus:ring-primary-500 flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-4 py-2 text-left text-gray-900 transition-colors duration-200 focus:ring-2 focus:outline-none"
          >
            <span>
              {internalStartDate && internalEndDate
                ? isSameDay(internalStartDate, internalEndDate)
                  ? formatDateDisplay(internalStartDate)
                  : `${formatDateDisplay(internalStartDate)} ～ ${formatDateDisplay(internalEndDate)}`
                : placeholder}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        {calendarVisible && (
          <div className="absolute z-10 mt-1 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setInternalStartDate(null)
                  setInternalEndDate(null)
                  setIsSelecting(false)
                  if (onChange) onChange(null, null)
                }}
                className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                クリア
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarVisible(false)
                  // カレンダーが閉じられた後にフォーカスを復元
                  setTimeout(() => {
                    if (ref && typeof ref === 'object' && ref.current) {
                      const button = ref.current.querySelector('button')
                      button?.focus()
                    }
                  }, 10)
                }}
                className="bg-primary-600 hover:bg-primary-700 rounded px-4 py-2 text-sm font-medium text-white"
              >
                完了
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
)

export default DateRangePicker
