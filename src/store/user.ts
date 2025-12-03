import type { UserAuth } from '@/types/user'
import { atom } from 'nanostores'

export const userStore = atom<UserAuth | null>(null)
