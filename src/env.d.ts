/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: import('@/types/user').UserSessionData
    session: import('@/server/utils/redis-session').RedisSession
    csrfToken?: string
  }
}
