import React from 'react'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

/**
 * インライン表示用の汎用スピナー
 * - `size`: スピナーサイズ
 * - `label`: アクセシビリティ用/隣に表示するラベル（省略時は sr-only の文言を出力）
 */
export default function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
  const sizeClass = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span
        className={`border-t-primary-600 animate-spin rounded-full border-2 border-neutral-200 ${sizeClass}`}
      />
      {label ? (
        <span className="text-sm text-neutral-600">{label}</span>
      ) : (
        <span className="sr-only">読み込み中…</span>
      )}
    </span>
  )
}
