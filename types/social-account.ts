// 社媒账号模块类型定义（与 Prisma Schema 同步）

import type { PublishPlatform } from "./publish"

// ============================================================================
// 枚举类型
// ============================================================================

/** 社媒账号状态 */
export type SocialAccountStatus =
  | "PENDING"   // 待验证
  | "ACTIVE"    // 正常
  | "EXPIRED"   // 授权过期
  | "DISABLED"  // 已禁用

// ============================================================================
// 业务类型
// ============================================================================

/** 社媒账号 */
export interface SocialAccount {
  id: string
  userId: string
  platform: PublishPlatform
  accountName: string
  accountId: string | null
  accountUrl: string | null
  avatarUrl: string | null
  status: SocialAccountStatus
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
}

/** 账号统计数据 */
export interface AccountStats {
  total: number
  active: number
  expired: number
  disabled: number
  byPlatform: Record<PublishPlatform, number>
}

/** 账号简要信息（用于任务关联展示） */
export interface AccountBrief {
  id: string
  platform: PublishPlatform
  accountName: string
  avatarUrl: string | null
}

// ============================================================================
// UI 辅助类型
// ============================================================================

/** 账号状态配置 */
export interface AccountStatusConfig {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  dotColor: string
}

/** 账号状态配置映射 */
export const ACCOUNT_STATUS_CONFIGS: Record<SocialAccountStatus, AccountStatusConfig> = {
  PENDING: { label: "待验证", variant: "secondary", dotColor: "bg-yellow-500" },
  ACTIVE: { label: "正常", variant: "default", dotColor: "bg-green-500" },
  EXPIRED: { label: "已过期", variant: "destructive", dotColor: "bg-red-500" },
  DISABLED: { label: "已禁用", variant: "outline", dotColor: "bg-gray-500" },
}

// ============================================================================
// 表单类型
// ============================================================================

/** 创建账号表单数据 */
export interface CreateAccountFormData {
  platform: PublishPlatform
  accountName: string
  accountUrl?: string
  avatarUrl?: string
}

/** 更新账号表单数据 */
export interface UpdateAccountFormData {
  accountName?: string
  accountUrl?: string
  avatarUrl?: string
}

/** 账号筛选条件 */
export interface AccountFilter {
  platform?: PublishPlatform
  status?: SocialAccountStatus
  search?: string
}
