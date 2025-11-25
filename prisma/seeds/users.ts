import type { PrismaClient } from '../../src/generated/prisma/client'
import { runSeed } from './_common'

async function seedUsers(prisma: PrismaClient): Promise<void> {
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@example.com',
        name: '管理者',
        password: '$2a$10$XLEGbbEKPN6WUHyV6Iv9zeT90nZTJl3uz4HPelKblOaQQgEicWijW',
        role: 'ADMIN'
      },
      {
        email: 'user@example.com',
        name: '一般ユーザ',
        password: '$2a$10$XLEGbbEKPN6WUHyV6Iv9zeT90nZTJl3uz4HPelKblOaQQgEicWijW',
        role: 'MEMBER'
      }
    ],
    skipDuplicates: true
  })
}

runSeed('Users', seedUsers)
