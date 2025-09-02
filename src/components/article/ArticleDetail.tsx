import ArticleFetch from '@/fetch/article'
import useSWR from '@/hooks/swr'
import type { Article } from '@/types/article'
import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const ArticleDetail: React.FC = () => {
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    // URLからスラッグを取得
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/articles\/(.+)$/)
    if (slugMatch) {
      setSlug(slugMatch[1])
    }
  }, [])

  // SWRで記事データを取得
  const { data, error, isLoading } = useSWR(
    slug ? `article-${slug}` : null,
    () => ArticleFetch.getArticleBySlug(slug!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    )
  }

  // エラー状態
  if (error || !data || !data.success) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-lg text-red-600">
          {error ? '記事の読み込みに失敗しました' : data?.message || '記事が見つかりません'}
        </div>
        <a href="/articles" className="text-green-600 transition-colors hover:text-green-800">
          ← 記事一覧に戻る
        </a>
      </div>
    )
  }

  const article = data.data.article

  // ページタイトルを更新
  useEffect(() => {
    if (article.title) {
      document.title = `${article.title} - 記事詳細`
    }
  }, [article.title])

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
        {/* カテゴリーとタグ */}
        <div className="mb-4 flex flex-wrap gap-2">
          {article.category && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
              {article.category}
            </span>
          )}
          {article.tags &&
            article.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                {tag}
              </span>
            ))}
        </div>

        {/* タイトル */}
        <h1 className="mb-4 text-3xl font-bold text-gray-900">{article.title}</h1>

        {/* メタ情報 */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span>公開日: {formatDate(article.publishedAt || article.createdAt)}</span>
          <span>作成者: {article.creator.name}</span>
          <span>閲覧数: {article.viewCount}</span>
          {article.isMemberOnly && (
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
              会員限定
            </span>
          )}
        </div>

        {/* SEO説明 */}
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
      <div className="prose prose-lg mb-8 max-w-none">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            img: ({ src, alt }) => (
              <img src={src} alt={alt} className="my-4 h-auto w-full rounded-lg shadow-md" />
            ),
            h2: ({ children }) => (
              <h2 className="mt-8 mb-4 text-2xl font-bold text-gray-900">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-6 mb-3 text-xl font-bold text-gray-800">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
            ul: ({ children }) => (
              <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 list-inside list-decimal space-y-2 text-gray-700">{children}</ol>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-green-500 pl-4 text-gray-600 italic">
                {children}
              </blockquote>
            ),
            code: ({ children, className }) => {
              const isInline = !className
              if (isInline) {
                return (
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-800">
                    {children}
                  </code>
                )
              }
              return (
                <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4">
                  <code className="text-sm">{children}</code>
                </pre>
              )
            }
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      {/* 添付ファイル */}
      {article.attachments && article.attachments.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-gray-900">添付ファイル</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {article.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center rounded-lg border bg-gray-50 p-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{attachment.originalName}</p>
                  <p className="text-sm text-gray-600">{attachment.filename}</p>
                </div>
                <a
                  href={`/uploads/articles/${attachment.filename}`}
                  download={attachment.originalName}
                  className="rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                >
                  ダウンロード
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フッター */}
      <div className="border-t pt-8">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
          <span>最終更新: {formatDate(article.updatedAt)}</span>
          <a href="/articles" className="text-green-600 transition-colors hover:text-green-800">
            ← 記事一覧に戻る
          </a>
        </div>
      </div>
    </div>
  )
}

export default ArticleDetail
