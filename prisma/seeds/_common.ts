import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import 'dotenv/config'
import { PrismaClient } from '../../src/generated/prisma/client'

/**
 * シードスクリプト用の共通 PrismaClient セットアップ
 */
export function setupPrisma(): PrismaClient {
  console.log(`[DB] DATABASE_URL: ${process.env.DATABASE_URL}`)
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
  return new PrismaClient({ adapter })
}

/**
 * シードスクリプト共通のメイン実行ラッパー
 */
export async function runSeed(
  seedName: string,
  seedFn: (prisma: PrismaClient) => Promise<void>
): Promise<void> {
  const prisma = setupPrisma()

  console.log(`[${seedName}] シード処理を開始します...`)

  try {
    await seedFn(prisma)
    console.log(`[${seedName}] シード処理が完了しました`)
  } catch (error) {
    console.error(`[${seedName}] エラーが発生しました:`, error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}
