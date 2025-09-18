import { evaluate } from '@mdx-js/mdx'
import { useMDXComponents } from '@mdx-js/react'
import * as jsxRuntime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'

// 共通の MDX (クライアント) コンパイル設定。
// 将来的に rehype プラグインやサニタイズ処理を追加する場合もここで一元管理。
export type CompileMdxOptions = {
  baseUrl?: string
}

export async function compileMdx(
  source: string,
  { baseUrl = import.meta.url }: CompileMdxOptions = {}
): Promise<React.ComponentType> {
  const mod = (await evaluate(source, {
    ...jsxRuntime,
    baseUrl,
    development: false,
    useMDXComponents,
    remarkPlugins: [remarkGfm]
  })) as { default: React.ComponentType }
  return mod.default
}
