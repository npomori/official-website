import { PrismaClient } from '@/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(import.meta.env.DATABASE_URL!)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaInstance
}

export default class BaseDB {
  // Prismaクライアント生成（グローバルシングルトンパターン）
  static prisma: PrismaClient = prismaInstance
}
