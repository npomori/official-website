import type { Article } from '@/types/article'
import React, { useState } from 'react'

interface ArticleHeaderInfoProps {
  article: Article
  isOpen: boolean
  onToggle: () => void
  onUpdate?: (updates: Partial<Article>) => void
  readonly?: boolean
  hideHeader?: boolean
}

export default function ArticleHeaderInfo({
  article,
  isOpen,
  onToggle,
  onUpdate,
  readonly = false,
  hideHeader = false
}: ArticleHeaderInfoProps) {
  const [formData, setFormData] = useState({
    title: article.title || '',
    seoDescription: article.seoDescription || '',
    seoKeywords: article.seoKeywords || '',
    category: article.category || '',
    tags: (article.tags || []).join(', '),
    status: article.status || 'draft',
    isMemberOnly: article.isMemberOnly || false,
    publishedAt: article.publishedAt
      ? typeof article.publishedAt === 'string'
        ? article.publishedAt.slice(0, 10)
        : new Date(article.publishedAt).toISOString().slice(0, 10)
      : ''
  })

  const handleChange = (field: string, value: string | boolean) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)

    if (onUpdate && !readonly) {
      const updates: Partial<Article> = { [field]: value }

      // タグの場合は配列に変換
      if (field === 'tags') {
        updates.tags =
          typeof value === 'string'
            ? value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : []
      }

      // 日付の場合は適切な形式に変換
      if (field === 'publishedAt' && typeof value === 'string') {
        updates.publishedAt = value ? new Date(value) : null
      }

      onUpdate(updates)
    }
  }

  return (
    <div
      className={`overflow-hidden ${hideHeader ? '' : 'rounded border border-neutral-200 bg-white shadow-sm'}`}
    >
      {/* ヘッダー部分 - hideHeaderがtrueの場合は非表示 */}
      {!hideHeader && (
        <button
          type="button"
          className="flex w-full items-center justify-between bg-neutral-50 px-4 py-3 text-left transition-colors hover:bg-neutral-100"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-neutral-700">記事設定</span>
            <span className="text-base text-neutral-500">
              ({article.status === 'published' ? '公開済み' : '下書き'})
            </span>
          </div>
          <span
            className={`inline-block h-4 w-4 transform transition-transform ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
      )}

      {isOpen && (
        <div className={`${hideHeader ? '' : 'border-t border-neutral-200'} p-4`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* タイトル */}
            <label className="block">
              <span className="mb-1 block text-base font-medium text-neutral-700">タイトル</span>
              <input
                type="text"
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:ring-1 focus:outline-none disabled:bg-neutral-50"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={readonly}
              />
            </label>

            {/* カテゴリ */}
            <label className="block">
              <span className="mb-1 block text-base font-medium text-neutral-700">カテゴリ</span>
              <input
                type="text"
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:ring-1 focus:outline-none disabled:bg-neutral-50"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                disabled={readonly}
                placeholder="例: お知らせ, イベント"
              />
            </label>

            {/* SEO説明 */}
            <label className="block md:col-span-2">
              <span className="mb-1 block text-base font-medium text-neutral-700">SEO説明</span>
              <textarea
                className="focus:border-primary-500 focus:ring-primary-500 h-20 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:ring-1 focus:outline-none disabled:bg-neutral-50"
                value={formData.seoDescription}
                onChange={(e) => handleChange('seoDescription', e.target.value)}
                disabled={readonly}
                placeholder="検索エンジンに表示される説明文"
              />
            </label>

            {/* タグ */}
            <label className="block">
              <span className="mb-1 block text-base font-medium text-neutral-700">タグ</span>
              <input
                type="text"
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:ring-1 focus:outline-none disabled:bg-neutral-50"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                disabled={readonly}
                placeholder="カンマ区切りで入力"
              />
            </label>

            {/* SEOキーワード */}
            <label className="block">
              <span className="mb-1 block text-base font-medium text-neutral-700">
                SEOキーワード
              </span>
              <input
                type="text"
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:ring-1 focus:outline-none disabled:bg-neutral-50"
                value={formData.seoKeywords}
                onChange={(e) => handleChange('seoKeywords', e.target.value)}
                disabled={readonly}
                placeholder="カンマ区切りで入力"
              />
            </label>

            {/* 公開日 */}
            <label className="block">
              <span className="mb-1 block text-base font-medium text-neutral-700">公開日</span>
              <input
                type="date"
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:ring-1 focus:outline-none disabled:bg-neutral-50"
                value={formData.publishedAt}
                onChange={(e) => handleChange('publishedAt', e.target.value)}
                disabled={readonly}
              />
            </label>

            {/* ステータス */}
            <label className="block">
              <span className="mb-1 block text-base font-medium text-neutral-700">ステータス</span>
              <select
                className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:ring-1 focus:outline-none disabled:bg-neutral-50"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={readonly}
              >
                <option value="draft">下書き</option>
                <option value="published">公開</option>
                <option value="archived">アーカイブ</option>
              </select>
            </label>

            {/* メンバー限定 */}
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                id="memberOnly"
                className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-neutral-300"
                checked={formData.isMemberOnly}
                onChange={(e) => handleChange('isMemberOnly', e.target.checked)}
                disabled={readonly}
              />
              <label htmlFor="memberOnly" className="text-base text-neutral-700">
                メンバー限定記事
              </label>
            </div>
          </div>

          {/* 記事情報 */}
          <div className="mt-4 border-t border-neutral-200 pt-4">
            <div className="grid grid-cols-1 gap-2 text-base text-neutral-500 md:grid-cols-3">
              <div>作成者: {article.creator?.name || '不明'}</div>
              <div>作成日: {new Date(article.createdAt).toLocaleDateString('ja-JP')}</div>
              <div>更新日: {new Date(article.updatedAt).toLocaleDateString('ja-JP')}</div>
              <div>記事ID: {article.id}</div>
              <div>閲覧数: {article.viewCount || 0}回</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
