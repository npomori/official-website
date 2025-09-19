import SpinnerOverlay from '@/components/base/SpinnerOverlay'
import ArticleFetch from '@/fetch/article'
import type { Article } from '@/types/article'
import React, { useCallback, useEffect, useState } from 'react'
import ArticleEditor from './ArticleEditor'
import ArticleEditorHeader from './ArticleEditorHeader'
import ArticleHeaderInfo from './ArticleHeaderInfo'
import ArticlePreview from './ArticlePreview'

interface ArticleEditorPageProps {
  id: number
}

export default function ArticleEditorPage({ id }: ArticleEditorPageProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState<string>('')
  const [headerInfoOpen, setHeaderInfoOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await ArticleFetch.getArticle(id)
    if (!res.success) {
      setError(res.message || '取得に失敗しました')
    } else if (res.data?.article) {
      setArticle(res.data.article)
      setContent(res.data.article.content || '')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = useCallback(async () => {
    if (!article) return
    setSaving(true)
    const updateData = {
      content,
      title: article.title,
      seoDescription: article.seoDescription,
      seoKeywords: article.seoKeywords,
      category: article.category,
      tags: article.tags,
      status: article.status,
      isMemberOnly: article.isMemberOnly,
      publishedAt: article.publishedAt
    }
    const res = await ArticleFetch.updateArticleContent(article.id, updateData)
    if (!res.success) {
      setError(res.message || '保存に失敗しました')
    } else if (res.data?.article) {
      setArticle(res.data.article)
      // 取得し直したサーバー側コンテンツで同期 (サーバー側正規化がある場合に備える)
      setContent(res.data.article.content || content)
    }
    setSaving(false)
  }, [article, content])

  const handleBack = useCallback(() => {
    window.history.back()
  }, [])

  const handleUpdateArticle = useCallback(
    (updates: Partial<Article>) => {
      if (!article) return
      const updatedArticle = { ...article, ...updates }
      setArticle(updatedArticle)
    },
    [article]
  )

  if (loading) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <SpinnerOverlay show fixed text="記事を読み込み中..." spinnerSize="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow">
          <div className="mb-4 text-5xl">⚠️</div>
          <p className="mb-2 font-semibold text-red-600">エラーが発生しました</p>
          <p className="mb-4 text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#fafafa'
        }}
      >
        <p style={{ color: '#6b7280' }}>記事が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <ArticleEditorHeader
        title={`記事編集: ${article.title}`}
        onSave={handleSave}
        onBack={handleBack}
        saving={saving}
        article={article}
        onUpdateArticle={handleUpdateArticle}
        headerInfoOpen={headerInfoOpen}
        onToggleHeaderInfo={() => setHeaderInfoOpen((o) => !o)}
      />

      {article && headerInfoOpen && (
        <div className="flex flex-col gap-0 px-4 pb-0">
          <ArticleHeaderInfo
            article={article}
            isOpen={true}
            onToggle={() => {}}
            onUpdate={handleUpdateArticle}
            readonly={false}
            hideHeader={true}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center gap-4 overflow-hidden p-4 lg:flex-row">
        <div className="flex min-h-72 max-w-4xl min-w-0 flex-1 flex-col lg:min-h-0">
          <ArticleEditor content={content} onChange={setContent} />
        </div>
        <div className="flex min-h-72 max-w-4xl min-w-0 flex-1 flex-col lg:min-h-0">
          <ArticlePreview content={content} />
        </div>
      </div>
    </div>
  )
}
