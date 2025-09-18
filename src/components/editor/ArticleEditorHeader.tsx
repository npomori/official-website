import type { Article } from '@/types/article'
import { Icon } from '@iconify/react'
import React from 'react'

interface ArticleEditorHeaderProps {
  title?: string
  onSave?: () => void
  onBack?: () => void
  saving?: boolean
  className?: string
  article?: Article
  onUpdateArticle?: (updates: Partial<Article>) => void
  headerInfoOpen?: boolean // 親から制御される場合に使用
  onToggleHeaderInfo?: () => void // 親制御用トグル関数
}

export default function ArticleEditorHeader({
  title = '記事編集',
  onSave,
  onBack,
  saving = false,
  className = '',
  article,
  onUpdateArticle: _onUpdateArticle,
  headerInfoOpen: controlledOpen,
  onToggleHeaderInfo
}: ArticleEditorHeaderProps) {
  // 制御/非制御両対応
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const headerInfoOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const handleToggleHeaderInfo = () => {
    if (onToggleHeaderInfo) {
      onToggleHeaderInfo()
    } else {
      setUncontrolledOpen((prev) => !prev)
    }
  }

  return (
    <div className={`flex-shrink-0 ${className}`}>
      {/* ナビゲーションバー */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              className="cursor-pointer rounded-md border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm text-neutral-700 transition-all duration-200 hover:border-neutral-400 hover:bg-neutral-200"
              onClick={onBack}
            >
              ← 戻る
            </button>
          )}
          <h1 className="m-0 text-xl font-semibold text-neutral-900">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* 記事設定ボタン */}
          {article && (
            <button
              className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                headerInfoOpen
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
              }`}
              onClick={handleToggleHeaderInfo}
            >
              <span className="flex items-center gap-1">
                <Icon
                  icon="mdi:file-document-edit-outline"
                  className="h-5 w-5 text-neutral-600"
                  aria-hidden="true"
                />
                <span>記事情報</span>
                <span
                  className={`inline-block h-3 w-3 transform transition-transform ${
                    headerInfoOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                >
                  ▾
                </span>
              </span>
            </button>
          )}

          {/* 保存ボタン */}
          {onSave && (
            <button
              className={`cursor-pointer rounded-md border-none px-4 py-2 text-sm font-medium text-white transition-all duration-200 ${
                saving ? 'cursor-not-allowed bg-neutral-500' : 'bg-primary-600 hover:bg-primary-700'
              }`}
              onClick={onSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* 記事設定パネルはレイアウト側に移動 */}
    </div>
  )
}
