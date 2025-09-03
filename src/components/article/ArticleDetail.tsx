import WorkingMDXRenderer from '@/components/article/WorkingMDXRenderer'
import ArticleFetch from '@/fetch/article'
import useSWR from '@/hooks/swr'
import type { Article, ArticleAttachment } from '@/types/article'
import React, { useEffect, useState } from 'react'

type ArticleDetailProps = {
  id?: number
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ id }) => {
  const [articleId, setArticleId] = useState<number | null>(null)
  const [initialized, setInitialized] = useState<boolean>(false)

  // 初期化用useEffect
  useEffect(() => {
    if (typeof id === 'number' && !Number.isNaN(id)) {
      setArticleId(id)
      setInitialized(true)
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const pathname = window.location.pathname
    const idMatch = pathname.match(/\/article\/(\d+)(?:\/?|$)/)
    if (idMatch && idMatch[1]) {
      const extractedId = Number(idMatch[1])
      setArticleId(extractedId)
      setInitialized(true)
      return
    }

    const segments = pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    const num = Number(last)
    if (!Number.isNaN(num)) {
      setArticleId(num)
      setInitialized(true)
      return
    }

    setInitialized(true)
  }, [id])

  // クライアントサイドでの追加初期化
  useEffect(() => {
    if (!initialized && typeof window !== 'undefined') {
      const pathname = window.location.pathname
      const idMatch = pathname.match(/\/article\/(\d+)(?:\/?|$)/)
      if (idMatch && idMatch[1]) {
        const extractedId = Number(idMatch[1])
        setArticleId(extractedId)
        setInitialized(true)
      }
    }
  }, [initialized])

  // SWRを使用してデータ取得
  const {
    data: articleResponse,
    error: fetchError,
    isLoading
  } = useSWR<{ article: Article }>(
    initialized && articleId ? `/api/article/${articleId}` : null,
    () => ArticleFetch.getArticle(articleId!).then((response) => response.data!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000 // 1分間は重複リクエストを防ぐ
    }
  )

  // 記事データの取得
  const article = articleResponse?.article || null

  // ページタイトルを更新
  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} - 記事詳細`
    }
  }, [article])

  // 初期化中
  if (!initialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    )
  }

  // IDが取得できない
  if (articleId === null) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-lg text-red-600">
          記事IDが取得できませんでした
          <br />
          <span className="text-sm">
            URL: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
          </span>
          <br />
          <span className="text-sm">Props ID: {id}</span>
        </div>
        <a href="/article" className="text-green-600 transition-colors hover:text-green-800">
          ← 記事一覧に戻る
        </a>
      </div>
    )
  }

  // ローディング状態
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="text-lg text-gray-600">記事を読み込んでいます...</div>
      </div>
    )
  }

  // エラー状態
  if (fetchError) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-lg text-red-600">
          {fetchError instanceof Error ? fetchError.message : '記事が見つかりません'}
        </div>
        <a href="/article" className="text-green-800">
          ← 記事一覧に戻る
        </a>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-lg text-red-600">記事データの形式が正しくありません</div>
        <a href="/article" className="text-green-600 transition-colors hover:text-green-800">
          ← 記事一覧に戻る
        </a>
      </div>
    )
  }

  // 日付をフォーマット
  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        {/* カテゴリとタグ */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {article.category && (
            <span className="rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800">
              {article.category}
            </span>
          )}
          {article.tags &&
            article.tags.map((tag: string) => (
              <span key={tag} className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
                #{tag}
              </span>
            ))}
        </div>

        {/* タイトル */}
        <h1 className="mb-4 text-3xl font-bold text-gray-900">{article.title}</h1>

        {/* メタ情報 */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>公開日: {formatDate(String(article.publishedAt || article.createdAt))}</span>
          <span>作成者: {article.creator.name}</span>
          <span>閲覧数: {article.viewCount}</span>
          {article.isMemberOnly && (
            <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-800">メンバー限定</span>
          )}
        </div>

        {/* 説明 */}
        {article.seoDescription && (
          <p className="text-lg leading-relaxed text-gray-600">{article.seoDescription}</p>
        )}
      </div>

      {/* アイキャッチ画像 */}
      {article.featuredImage && (
        <div className="mb-8">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="h-auto w-full rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* 記事本文 */}
      <div className="prose prose-lg max-w-none">
        {article.content && <WorkingMDXRenderer content={article.content} />}
      </div>

      {/* 添付ファイル */}
      {article.attachments && article.attachments.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">添付ファイル</h3>
          <div className="space-y-2">
            {article.attachments.map((attachment: ArticleAttachment, index: number) => (
              <div key={index} className="flex items-center gap-2 rounded border p-3">
                <svg
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <a
                  href={`/uploads/documents/${attachment.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 transition-colors hover:text-green-800"
                >
                  {attachment.originalName || attachment.filename}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 戻るリンク */}
      <div className="mt-12 border-t pt-8">
        <a
          href="/article"
          className="inline-flex items-center text-green-600 transition-colors hover:text-green-800"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          記事一覧に戻る
        </a>
      </div>
    </div>
  )
}

export default ArticleDetail
