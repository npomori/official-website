import React, { useEffect, useState } from 'react'
import ArticleMDXRenderer from '../article/ArticleMDXRenderer'
import SpinnerOverlay from '../base/SpinnerOverlay'

interface PreviewProps {
  content: string
  className?: string
}

export default function ArticlePreview({ content, className = '' }: PreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // プレビューに実際に描画するコンテンツ（デバウンス適用）
  const [displayContent, setDisplayContent] = useState<string>(content)

  useEffect(() => {
    // プレビューが更新される際の処理
    setIsLoading(true)
    setError(null)

    // デバウンス: 入力から少し待ってから描画内容を差し替える
    const timer = setTimeout(() => {
      setDisplayContent(content)
      setIsLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [content])

  // 矩形計測は不要（親 relative + 子 overflow-auto の構成で中央固定のオーバーレイにする）

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white ${className}`}
    >
      <div className="flex flex-shrink-0 items-center border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <span className="font-bold text-neutral-700">プレビュー</span>
      </div>
      <div className="relative min-h-0 flex-1" aria-busy={isLoading && !error}>
        <div className={`h-full ${isLoading && !error ? 'overflow-hidden' : 'overflow-auto'}`}>
          {error ? (
            <div className="bg-error-50 border-error-200 text-error-600 m-4 flex items-start gap-3 rounded-md border p-4">
              <div className="flex-shrink-0 text-xl">⚠️</div>
              <div>
                <strong className="mb-1 block font-semibold">プレビューエラー</strong>
                <p className="text-error-800 m-0">{error}</p>
              </div>
            </div>
          ) : displayContent.trim() ? (
            <div className="prose max-w-none p-4">
              <ArticleMDXRenderer content={displayContent} />
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center gap-3 text-center text-neutral-400">
              <div className="text-5xl opacity-50">📝</div>
              <p className="m-0 max-w-xs leading-relaxed">
                エディターでコンテンツを入力すると
                <br />
                ここにプレビューが表示されます
              </p>
            </div>
          )}
        </div>
        <SpinnerOverlay show={isLoading && !error} text="プレビューを生成中..." />
      </div>
    </div>
  )
}
