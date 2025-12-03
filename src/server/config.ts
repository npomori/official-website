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
  //PUBLIC_ROUTES: ['/', '/api/auth/login', '/api/auth/logout'], // アクセス制限しないURL
  PUBLIC_ROUTES: ['/', '/api/auth'], // アクセス制限しないURL
  PROTECTED_ROUTES: ['/admin', '/editor', '/api/admin', '/api/member'], // ログインが必要なURL
  EDITOR_ENABLED_ROUTES: [
    '/api/admin/event',
    '/api/admin/record',
    '/api/admin/news',
    '/api/admin/article',
    '/api/admin/location'
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
  SITE_URL: import.meta.env.SITE_URL || 'http://localhost:3000',

  // レート制限設定
  RATE_LIMIT: {
    // 認証API（ログイン、パスワードリセット実行、ユーザ認証）
    AUTH: {
      MAX_REQUESTS: toNumber(import.meta.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 5),
      WINDOW_MS: toNumber(import.meta.env.RATE_LIMIT_AUTH_WINDOW_MS, 5 * 60 * 1000) // 5分
    },
    // パスワードリセット申請
    PASSWORD_RESET: {
      MAX_REQUESTS: toNumber(import.meta.env.RATE_LIMIT_PASSWORD_RESET_MAX_REQUESTS, 3),
      WINDOW_MS: toNumber(import.meta.env.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS, 60 * 60 * 1000) // 1時間
    },
    // メール送信
    EMAIL: {
      MAX_REQUESTS: toNumber(import.meta.env.RATE_LIMIT_EMAIL_MAX_REQUESTS, 1),
      WINDOW_MS: toNumber(import.meta.env.RATE_LIMIT_EMAIL_WINDOW_MS, 15 * 60 * 1000) // 15分
    },
    // 一般API
    GENERAL: {
      MAX_REQUESTS: toNumber(import.meta.env.RATE_LIMIT_GENERAL_MAX_REQUESTS, 30),
      WINDOW_MS: toNumber(import.meta.env.RATE_LIMIT_GENERAL_WINDOW_MS, 60 * 1000) // 1分
    },
    // お問い合わせフォーム
    CONTACT: {
      MAX_REQUESTS: toNumber(import.meta.env.RATE_LIMIT_CONTACT_MAX_REQUESTS, 5),
      WINDOW_MS: toNumber(import.meta.env.RATE_LIMIT_CONTACT_WINDOW_MS, 60 * 60 * 1000) // 1時間
    },
    // 入会申し込み
    JOIN: {
      MAX_REQUESTS: toNumber(import.meta.env.RATE_LIMIT_JOIN_MAX_REQUESTS, 3),
      WINDOW_MS: toNumber(import.meta.env.RATE_LIMIT_JOIN_WINDOW_MS, 24 * 60 * 60 * 1000) // 1日
    },
    // トークン検証
    TOKEN_VERIFICATION: {
      MAX_REQUESTS: toNumber(import.meta.env.RATE_LIMIT_TOKEN_VERIFICATION_MAX_REQUESTS, 10),
      WINDOW_MS: toNumber(import.meta.env.RATE_LIMIT_TOKEN_VERIFICATION_WINDOW_MS, 60 * 1000) // 1分
    }
  }
}
export default config
