import type { User, Session } from "@/lib/generated/prisma/client"

export type SafeUser = Omit<User, "passwordHash">

export interface SessionWithUser {
  user: User
  sessionId: string
}

export interface AuthState {
  user: SafeUser | null
  isLoading: boolean
}

export type { User, Session }
