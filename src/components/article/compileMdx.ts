import config from '@/types/config'
import { evaluate } from '@mdx-js/mdx'
import { useMDXComponents } from '@mdx-js/react'
import * as jsxRuntime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'

// 共通の MDX (クライアント) コンパイル設定。
// 将来的に rehype プラグインやサニタイズ処理を追加する場合もここで一元管理。
export type CompileMdxOptions = {
  baseUrl?: string
}

// 見出し(H1→H2, H2→H3, ...)を指定段階だけ下げるremarkプラグイン
function remarkDemoteHeadings(shift = 1) {
  return (tree: unknown) => {
    // 型には依存せず、実行時に安全に処理
    visit(tree as never, 'heading', (node: unknown) => {
      const h = node as { depth?: number }
      const current = typeof h.depth === 'number' ? h.depth : 1
      const next = Math.min(6, Math.max(1, current + shift))
      ;(h as { depth: number }).depth = next
    })
  }
}

export async function compileMdx(
  source: string,
  { baseUrl = import.meta.url }: CompileMdxOptions = {}
): Promise<React.ComponentType> {
  // 設定から見出しシフト量を取得（未設定時は0=変更なし）
  const headingShiftRaw = config?.content?.article?.headingShift ?? 0
  const headingShift = Number.isFinite(headingShiftRaw)
    ? Math.max(0, Math.min(5, Number(headingShiftRaw)))
    : 0
  const mod = (await evaluate(source, {
    ...jsxRuntime,
    baseUrl,
    development: false,
    useMDXComponents,
    remarkPlugins: [remarkGfm, [remarkDemoteHeadings, headingShift]]
  })) as { default: React.ComponentType }
  return mod.default
}
