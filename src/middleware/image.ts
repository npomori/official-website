import type { MiddlewareHandler } from 'astro'

const ensureImageTransform: MiddlewareHandler = async (context, next) => {
  if (context.url.pathname === '/_image') {
    const params = context.url.searchParams
    const srcParam = params.get('src')?.trim()
    const hrefParam = params.get('href')?.trim()

    if (!srcParam && hrefParam) {
      params.set('src', hrefParam)
      const normalizedUrl = `${context.url.pathname}?${params.toString()}`

      // 307 Temporary Redirect preserves the original method while updating the URL once
      return context.redirect(normalizedUrl, 307)
    }

    if (!srcParam && !hrefParam) {
      console.warn('[ImageMiddleware] Missing src parameter for /_image request', {
        requestUrl: context.request.url,
        referer: context.request.headers.get('referer') ?? undefined
      })

      return new Response('画像の取得に必要なパラメータが不足しています。', {
        status: 400,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store'
        }
      })
    }
  }

  return next()
}

export const onRequest = ensureImageTransform
