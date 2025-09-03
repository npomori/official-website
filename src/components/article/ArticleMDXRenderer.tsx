import { evaluate } from '@mdx-js/mdx'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'
import React, { useEffect, useMemo, useState } from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'

// カスタムMDXコンポーネント
import AutoEmbedLink from './mdx/AutoEmbedLink'
import ImageGallery from './mdx/ImageGallery'
import ImageTextLayout from './mdx/ImageTextLayout'
import InfoCard from './mdx/InfoCard'
import MDXImage from './mdx/MDXImage'

export type ArticleMDXRendererProps = {
  content: string
}

export default function ArticleMDXRenderer({ content }: ArticleMDXRendererProps) {
  const [MDXContent, setMDXContent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const components = useMemo(
    () => ({
      MDXImage,
      ImageGallery,
      InfoCard,
      ImageTextLayout,
      a: AutoEmbedLink
    }),
    []
  )

  useEffect(() => {
    let cancelled = false

    async function compileAndRun() {
      setError(null)
      try {
        const mod = (await evaluate(content, {
          ...jsxRuntime,
          baseUrl: import.meta.url,
          development: false,
          useMDXComponents,
          remarkPlugins: [remarkGfm]
        })) as { default: React.ComponentType }
        if (!cancelled) {
          setMDXContent(() => mod.default)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (!cancelled) {
          setError(message)
        }
      }
    }

    if (content && content.trim().length > 0) {
      void compileAndRun()
    } else {
      setMDXContent(() => () => <p className="text-gray-500">本文は準備中です。</p>)
    }

    return () => {
      cancelled = true
    }
  }, [content])

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        MDXのレンダリング中にエラーが発生しました: {error}
      </div>
    )
  }

  if (!MDXContent) {
    return (
      <div className="text-gray-500">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent align-[-2px]"></span>
        <span className="ml-2 text-sm">読み込み中…</span>
      </div>
    )
  }

  return (
    <MDXProvider components={components}>
      <MDXContent />
    </MDXProvider>
  )
}
