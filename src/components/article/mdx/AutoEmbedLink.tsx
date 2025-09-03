import React from 'react'

// シンプルな外部リンク自動埋め込み（YouTubeなどはそのままaタグでOK、必要なら拡張）
// MDX内の <a> を差し替える。
export default function AutoEmbedLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href = '', children, ...rest } = props

  // 新しいタブで開く + セキュリティ属性
  const external = href.startsWith('http')
  const rel = external ? 'noopener noreferrer' : rest.rel
  const target = external ? '_blank' : rest.target

  return (
    <a
      href={href}
      rel={rel}
      target={target}
      className={`text-green-700 underline underline-offset-2 hover:text-green-900 ${rest.className || ''}`}
      {...rest}
    >
      {children}
    </a>
  )
}
