"use server"

import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { signToken } from "@/lib/auth/jwt"
import { setSessionCookie, SESSION_MAX_AGE } from "@/lib/auth/session"
import { loginSchema } from "@/lib/validations/auth"

interface LoginState {
  error: string | null
}

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = loginSchema.safeParse(rawData)
  if (!result.success) {
    return { error: "请输入有效的邮箱和密码" }
  }

  const { email, password } = result.data

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return { error: "邮箱或密码错误" }
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return { error: "邮箱或密码错误" }
  }

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  const session = await db.session.create({
    data: { userId: user.id, expiresAt },
  })

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  })

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  await setSessionCookie(token)

  redirect("/inbox")
}
