interface Options {
  prefix?: string
  scanCount?: number
  serializer?: any
  client: any
  ttl?: number
  disableTTL?: boolean
  disableTouch?: boolean
}

class RedisSession {
  prefix: string
  scanCount: number
  serializer: any
  client: any
  ttl: number
  disableTTL: boolean
  disableTouch: boolean

  constructor(options: Options) {
    this.prefix = ''
    this.scanCount = Number(options.scanCount) || 100
    this.serializer = options.serializer || JSON
    this.client = options.client
    this.ttl = options.ttl || 1800 // 30 minutes
    this.disableTTL = options.disableTTL || false
    this.disableTouch = options.disableTouch || false
  }

  async get(sid: string) {
    const key = this.prefix + sid

    const data = await this.client.get(key)
    if (!data) return null

    let value
    try {
      value = this.serializer.parse(data)
    } catch (err) {
      return null
    }
    return value
  }

  async set(sid: string, sess: any) {
    const args = [this.prefix + sid]

    let value
    try {
      value = this.serializer.stringify(sess)
    } catch (er) {
      return null
    }
    args.push(value)

    let ttl = 1
    if (!this.disableTTL) {
      ttl = this._getTTL(sess)
      args.push('EX', ttl.toString())
    }

    if (ttl > 0) {
      return await this.client.set(args)
    } else {
      // If the resulting TTL is negative we can delete / destroy the key
      return await this.destroy(sid)
    }
  }

  async touch(sid: string, sess?: unknown) {
    if (this.disableTouch || this.disableTTL) return null

    const key = this.prefix + sid
    const err = await this.client.expire(key, this._getTTL(sess))
    return err
  }

  async destroy(sid: string) {
    const key = this.prefix + sid
    const err = await this.client.del(key)
    return err
  }

  async clear() {
    const keys: string[] = await this.client.keys(this.prefix + '*')
    if (!keys) return

    keys.forEach(async (key) => {
      await this.client.del(key)
    })
  }

  /**
   * 特定のユーザーIDに紐づくすべてのセッションを削除
   * @param userId ユーザーID
   * @returns 削除されたセッション数
   */
  async destroyByUserId(userId: number): Promise<number> {
    const keys: string[] = await this.client.keys(this.prefix + '*')
    if (!keys || keys.length === 0) return 0

    let deletedCount = 0

    for (const key of keys) {
      const data = await this.client.get(key)
      if (!data) continue

      try {
        const session = this.serializer.parse(data)
        // セッションデータからユーザーIDを確認
        if (session?.user?.id === userId) {
          await this.client.del(key)
          deletedCount++
        }
      } catch (err) {
        console.error('セッション解析エラー:', err)
        continue
      }
    }

    return deletedCount
  }

  _getTTL(sess?: any) {
    let ttl
    if (sess && sess.cookie && sess.cookie.expires) {
      const ms = Number(new Date(sess.cookie.expires)) - Date.now()
      ttl = Math.ceil(ms / 1000)
    } else {
      ttl = this.ttl
    }
    return ttl
  }
}

export default RedisSession
