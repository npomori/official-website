// 環境変数を数値に変換するユーティリティ
const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  if (typeof value === 'string') {
    const v = value.trim()
    if (v === '') return fallback
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

// サーバ専用の定義値をここに設定する
const config = {
  // アクセス制御用
  PUBLIC_ROUTES: ['/', '/api/auth/login', '/api/auth/logout'], // アクセス制限しないURL
  PROTECTED_ROUTES: ['/admin', '/editor', '/api/admin', '/api/member'], // ログインが必要なURL
  EDITOR_ENABLED_ROUTES: [
    '/api/admin/event',
    '/api/admin/record',
    '/api/admin/news',
    '/api/admin/article'
  ], // EDITORロールがアクセスできるURL

  SESSION_COOKIE_NAME: import.meta.env.SESSION_COOKIE_NAME || '__session', // クッキー作成用シークレットコード
  SESSION_COOKIE_SECRET: import.meta.env.SESSION_COOKIE_SECRET || 'secret',
  SESSION_EXPIRES: import.meta.env.SESSION_EXPIRES
    ? parseInt(import.meta.env.SESSION_EXPIRES, 10)
    : 60 * 30, // 30分
  SESSION_ID_PREFIX: import.meta.env.SESSION_ID_PREFIX || 'sess:', // Redisセッション保存用セッションIDプレフィックス
  SESSION_REDIS_URL: import.meta.env.SESSION_REDIS_URL || 'redis://localhost:6379/',

  REMEMBERME_COOKIE_NAME: import.meta.env.REMEMBERME_COOKIE_NAME || '__rememberme', // クッキー作成用シークレットコード
  REMEMBERME_COOKIE_SECRET: import.meta.env.AUTH_REMEMBERME_COOKIE_SECRET || 'rememberm_secret',
  REMEMBERME_COOKIE_DAYS: import.meta.env.AUTH_REMEMBERME_COOKIE_DAYS || 120, // 120日
  REMEMBERME_EXPIRES: import.meta.env.AUTH_REMEMBERME_EXPIRES
    ? parseInt(import.meta.env.AUTH_REMEMBERME_EXPIRES, 10)
    : 60 * 60 * 24 * 120, // 120日

  // SMTP設定
  SMTP_HOST: import.meta.env.SMTP_HOST || 'smtp.example.com',
  SMTP_PORT: toNumber(import.meta.env.SMTP_PORT, 587),
  SMTP_USER: import.meta.env.SMTP_USER || 'your-email@example.com',
  SMTP_PASSWORD: import.meta.env.SMTP_PASSWORD || 'your-password',
  MAIL_FROM: import.meta.env.MAIL_FROM || 'noreply@example.com',

  // メール送信設定
  CONTACT_EMAIL: import.meta.env.CONTACT_EMAIL || 'info@example.com', // お問い合わせ送信先メールアドレス

  // サイトURL
  SITE_URL: import.meta.env.SITE_URL || 'http://localhost:3000'
}
export default config
