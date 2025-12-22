"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from "@/lib/validations/user"

interface ActionState {
  success?: boolean
  error?: string | Record<string, string[]>
}

export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || session.user.role !== "ADMIN") {
    return { error: "无权限" }
  }

  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  }

  const result = createUserSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const existing = await db.user.findUnique({
    where: { email: result.data.email },
  })
  if (existing) {
    return { error: { email: ["该邮箱已被使用"] } }
  }

  const passwordHash = await hashPassword(result.data.password)

  await db.user.create({
    data: {
      email: result.data.email,
      passwordHash,
      name: result.data.name,
      role: result.data.role,
    },
  })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function updateUser(
  userId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || session.user.role !== "ADMIN") {
    return { error: "无权限" }
  }

  const rawData = {
    name: formData.get("name") || undefined,
    role: formData.get("role") || undefined,
    isActive: formData.get("isActive") === "true",
  }

  const result = updateUserSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  await db.user.update({
    where: { id: userId },
    data: result.data,
  })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function resetUserPassword(
  userId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || session.user.role !== "ADMIN") {
    return { error: "无权限" }
  }

  const rawData = {
    password: formData.get("password"),
  }

  const result = resetPasswordSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const passwordHash = await hashPassword(result.data.password)

  await db.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  // 删除该用户所有会话，强制重新登录
  await db.session.deleteMany({ where: { userId } })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function toggleUserStatus(userId: string): Promise<ActionState> {
  const session = await getSession()
  if (!session || session.user.role !== "ADMIN") {
    return { error: "无权限" }
  }

  // 不能禁用自己
  if (session.user.id === userId) {
    return { error: "不能禁用自己的账号" }
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { error: "用户不存在" }
  }

  await db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  })

  // 如果禁用用户，删除其所有会话
  if (user.isActive) {
    await db.session.deleteMany({ where: { userId } })
  }

  revalidatePath("/admin/users")
  return { success: true }
}
