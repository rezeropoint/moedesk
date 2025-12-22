import { z } from "zod"

export const createUserSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
  name: z.string().min(1, "请输入用户名"),
  role: z.enum(["ADMIN", "OPERATOR"]),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, "请输入用户名").optional(),
  role: z.enum(["ADMIN", "OPERATOR"]).optional(),
  isActive: z.boolean().optional(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "密码至少6个字符"),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
