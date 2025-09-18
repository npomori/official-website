import React from 'react'
import Spinner from './Spinner'

type SpinnerOverlayProps = {
  show: boolean
  text?: string
  className?: string
  fixed?: boolean
  spinnerSize?: 'sm' | 'md' | 'lg'
  backdropClassName?: string
  hideText?: boolean
}

/**
 * 領域や画面全体を覆うオーバーレイ型のスピナー。親要素が relative のときは absolute で覆います。
 */
export default function SpinnerOverlay({
  show,
  text = '処理中...',
  className = '',
  fixed = false,
  spinnerSize = 'md',
  backdropClassName = 'bg-white/60',
  hideText = false
}: SpinnerOverlayProps) {
  if (!show) return null

  return (
    <div
      className={`${fixed ? 'fixed inset-0' : 'absolute inset-0'} z-10 flex items-center justify-center ${backdropClassName} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {hideText ? <Spinner size={spinnerSize} /> : <Spinner size={spinnerSize} label={text} />}
    </div>
  )
}
