import { MDXProvider } from '@mdx-js/react'
import React, { useEffect, useMemo, useState } from 'react'
import { compileMdx } from './compileMdx'

// カスタムMDXコンポーネント
import Spinner from '../base/Spinner'
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
      a: AutoEmbedLink,
      table: (props: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="mdx-table-wrapper">
          <table {...props} className={`mdx-table ${props.className || ''}`.trim()} />
        </div>
      )
    }),
    []
  )

  useEffect(() => {
    let cancelled = false
    async function run() {
      setError(null)
      try {
        if (content && content.trim().length > 0) {
          const C = await compileMdx(content)
          if (!cancelled) setMDXContent(() => C)
        } else {
          if (!cancelled)
            setMDXContent(() => () => <p className="text-gray-500">本文は準備中です。</p>)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (!cancelled) setError(message)
      }
    }
    void run()
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
        <Spinner size="sm" label="読み込み中…" />
      </div>
    )
  }

  return (
    <div className="mdx-clear-float">
      <MDXProvider components={components}>
        <MDXContent />
      </MDXProvider>
    </div>
  )
}
