import { NewsDB } from '@/server/db'
import { getConfig } from '@/types/config'
import type { APIRoute } from 'astro'

/**
 * HTMLタグを除去し、指定文字数にトリミングする
 */
function stripHtmlAndTruncate(html: string, maxLength: number): string {
  // HTMLタグを除去
  const text = html.replace(/<[^>]*>/g, '')
  // HTML エンティティをデコード
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // 連続する空白を1つにまとめる
  const normalized = decoded.replace(/\s+/g, ' ').trim()
  // 指定文字数にトリミング
  if (normalized.length <= maxLength) {
    return normalized
  }
  return normalized.substring(0, maxLength) + '...'
}

/**
 * DateをRFC 822形式に変換
 * 例: Mon, 15 Mar 2026 12:00:00 +0900
 */
function toRFC822(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  const dayName = days[d.getDay()]
  const day = d.getDate().toString().padStart(2, '0')
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')

  // タイムゾーンオフセットを取得 (+0900形式)
  const offset = -d.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
    .toString()
    .padStart(2, '0')
  const offsetMinutes = (Math.abs(offset) % 60).toString().padStart(2, '0')
  const offsetSign = offset >= 0 ? '+' : '-'
  const timezone = `${offsetSign}${offsetHours}${offsetMinutes}`

  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} ${timezone}`
}

/**
 * XMLエスケープ（タイトルやリンク用）
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const GET: APIRoute = async () => {
  try {
    // 設定を取得
    const config = getConfig()
    const rssConfig = config.content.news.rss

    // RSS配信が無効の場合は404を返す
    if (!rssConfig?.enabled) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'RSS配信は現在無効になっています'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const maxItems = rssConfig.maxItems || 20
    const descriptionLength = rssConfig.descriptionLength || 200
    const siteTitle = config.site.title
    const siteUrl = config.site.organization.url
    const siteDescription = config.site.head.defaultDescription

    // お知らせ一覧と同じロジックで取得（ゲストとして、管理権限なしで取得）
    // hasAdminRole=false, isLoggedIn=false により、以下がフィルタリングされます：
    // - status: 'published' のみ（公開済み）
    // - date < 翌日の0:00:00 のみ（本日以前）
    // - isMemberOnly: false のみ（会員限定を除外）
    const { news: newsList } = await NewsDB.getNewsWithPagination(
      1, // ページ1
      maxItems as number, // 最大件数
      false, // hasAdminRole = 管理権限なし
      false // isLoggedIn = ゲスト（未ログイン）
      // category, priority は指定なし = 全カテゴリ・全優先度
    )

    // getNewsWithPagination の戻り値は isLoggedIn=false の場合 PublicNews[]
    // 既に会員限定記事は除外されているが、念のため再確認
    const publicNews = newsList.filter((news) => !news.isMemberOnly)

    // RSS 2.0 XMLを生成
    const items = publicNews
      .map((news) => {
        const title = escapeXml(news.title)
        const link = `${siteUrl}/news/${news.id}`
        const description = stripHtmlAndTruncate(news.content, descriptionLength as number)
        const pubDate = toRFC822(news.date)
        const guid = link

        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${guid}</guid>
    </item>`
      })
      .join('\n')

    const now = new Date()
    const lastBuildDate = toRFC822(now)

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ja</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`

    return new Response(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // 1時間キャッシュ
      }
    })
  } catch (error) {
    console.error('RSS Feed Generation Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'RSSフィードの生成に失敗しました'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
