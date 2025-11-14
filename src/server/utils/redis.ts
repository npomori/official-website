/**
 * Redis接続ユーティリティ
 */
import config from '@/server/config'
import Redis from 'ioredis'

let redisClient: Redis | null = null

/**
 * Redisクライアントを取得
 * シングルトンパターンで接続を管理
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.SESSION_REDIS_URL as string, {
      // 再接続戦略
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      // 接続タイムアウト
      connectTimeout: 10000,
      // 最大リトライ回数
      maxRetriesPerRequest: 3,
      // 接続エラー時のログ
      lazyConnect: false,
      // 自動再接続
      enableReadyCheck: true,
      // キープアライブ
      keepAlive: 30000
    })

    redisClient.on('error', (err) => {
      console.error('Redis接続エラー:', err)
    })

    redisClient.on('connect', () => {
      console.log('Redis接続成功')
    })

    redisClient.on('ready', () => {
      console.log('Redis準備完了')
    })

    redisClient.on('close', () => {
      console.log('Redis接続クローズ')
    })

    redisClient.on('reconnecting', () => {
      console.log('Redis再接続中...')
    })
  }

  return redisClient
}

/**
 * Redis接続を閉じる
 * アプリケーション終了時に呼び出す
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    console.log('Redis接続を終了しました')
  }
}

/**
 * Redis接続状態を確認
 */
export function isRedisConnected(): boolean {
  return redisClient?.status === 'ready'
}
