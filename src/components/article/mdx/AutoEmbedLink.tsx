import React from 'react'

// YouTube URL 判定 (watch, youtu.be, shorts) を行い iframe 埋め込み。
// それ以外は通常リンク。
export default function AutoEmbedLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href = '', children, ...rest } = props

  // 1. YouTube 埋め込み判定
  const yt = parseYouTubeId(href)
  if (yt) {
    const { videoId, start } = yt
    const params = new URLSearchParams({ rel: '0', modestbranding: '1', controls: '1' })
    if (start) params.set('start', String(start))
    const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
    return (
      <div className="my-4 aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black">
        <iframe
          src={embedSrc}
          // sandbox で埋め込みを軽く制限 (必要に応じ調整)
          sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={typeof children === 'string' ? children : 'YouTube video'}
          className="h-full w-full"
          loading="lazy"
        />
      </div>
    )
  }

  // 2. 通常外部リンク
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

function parseYouTubeId(url: string): { videoId: string; start?: number } | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    let id = ''
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') {
        id = u.searchParams.get('v') || ''
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/')[2] || ''
      }
    } else if (host === 'youtu.be') {
      id = u.pathname.slice(1)
    }
    if (!/^[A-Za-z0-9_-]{6,}$/i.test(id)) return null
    // start time (t or start) 例: t=1m30s / 90 / 1m
    const startRaw = u.searchParams.get('t') || u.searchParams.get('start') || ''
    const start = parseYouTubeStart(startRaw)
    return { videoId: id, ...(start ? { start } : {}) }
  } catch {
    return null
  }
}

function parseYouTubeStart(raw: string): number | undefined {
  if (!raw) return undefined
  if (/^\d+$/.test(raw)) return Number(raw)
  // m/s 形式 (例 1m30s, 2m, 45s)
  const m = raw.match(/(?:(\d+)m)?(?:(\d+)s)?/)
  if (!m) return undefined
  const min = m[1] ? Number(m[1]) : 0
  const sec = m[2] ? Number(m[2]) : 0
  const total = min * 60 + sec
  return total > 0 ? total : undefined
}
