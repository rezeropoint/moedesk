"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  MoreHorizontal,
  Pencil,
  Ban,
  CheckCircle,
  Trash2,
  ExternalLink,
  Instagram,
  Youtube,
  AtSign,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SocialAccount, YouTubeChannelStats } from "@/types/social-account"
import type { PublishPlatform } from "@/types/publish"
import { ACCOUNT_STATUS_CONFIGS } from "@/types/social-account"

/** 格式化数字（简化显示：1.2K、3.4M 等） */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return num.toString()
}
import { PLATFORM_CONFIGS } from "@/types/publish"
import { EditAccountDialog } from "./edit-account-dialog"

interface AccountListProps {
  accounts: SocialAccount[]
  onUpdate: () => void
}

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

export function AccountList({ accounts, onUpdate }: AccountListProps) {
  const [editAccount, setEditAccount] = useState<SocialAccount | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const handleReauthorize = () => {
    // 跳转到 YouTube 授权
    window.location.href = "/api/oauth/youtube/authorize"
  }

  const handleRefreshToken = async (accountId: string) => {
    setRefreshingId(accountId)
    try {
      const response = await fetch(`/api/accounts/${accountId}/refresh-token`, {
        method: "POST",
      })
      if (response.ok) {
        onUpdate()
      } else {
        const result = await response.json()
        alert(result.error || "刷新失败")
      }
    } catch (error) {
      console.error("Refresh token failed:", error)
      alert("网络错误，请重试")
    } finally {
      setRefreshingId(null)
    }
  }

  const handleToggleStatus = async (account: SocialAccount) => {
    try {
      const response = await fetch(`/api/accounts/${account.id}/toggle-status`, {
        method: "POST",
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Toggle status failed:", error)
    }
  }

  const handleDelete = async (account: SocialAccount) => {
    if (!confirm(`确定要删除账号「${account.accountName}」吗？`)) return
    try {
      const response = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>暂无绑定账号</p>
        <p className="text-sm">点击右上角「添加账号」开始绑定</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>账号</TableHead>
              <TableHead>平台</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后使用</TableHead>
              <TableHead className="w-[70px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const platformConfig = PLATFORM_CONFIGS[account.platform]
              const statusConfig = ACCOUNT_STATUS_CONFIGS[account.status]
              const Icon = platformIcons[account.platform]

              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={account.avatarUrl || undefined} />
                        <AvatarFallback>
                          {account.accountName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.accountName}</span>
                          {account.accountUrl && (
                            <a
                              href={account.accountUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {/* 无频道提示 */}
                          {account.platform === "YOUTUBE" && !account.accountId && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              待创建频道
                            </Badge>
                          )}
                        </div>
                        {/* Google 邮箱（YouTube 账号） */}
                        {account.platform === "YOUTUBE" && account.googleEmail && (
                          <div className="text-xs text-muted-foreground">
                            {account.googleEmail}
                          </div>
                        )}
                        {/* YouTube 频道统计数据 */}
                        {account.platform === "YOUTUBE" && account.channelStats && (
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{formatNumber((account.channelStats as YouTubeChannelStats).subscriberCount)} 订阅</span>
                            <span>{formatNumber((account.channelStats as YouTubeChannelStats).videoCount)} 视频</span>
                            <span>{formatNumber((account.channelStats as YouTubeChannelStats).viewCount)} 播放</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", platformConfig.colorClass)} />
                      <span>{platformConfig.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", statusConfig.dotColor)} />
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      {/* Token 过期操作 */}
                      {account.status === "EXPIRED" && account.platform === "YOUTUBE" && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={handleReauthorize}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          重新授权
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.lastUsedAt
                      ? new Date(account.lastUsedAt).toLocaleDateString("zh-CN")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditAccount(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        {/* YouTube 刷新 Token */}
                        {account.platform === "YOUTUBE" && account.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => handleRefreshToken(account.id)}
                            disabled={refreshingId === account.id}
                          >
                            <RefreshCw className={cn(
                              "mr-2 h-4 w-4",
                              refreshingId === account.id && "animate-spin"
                            )} />
                            刷新 Token
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(account)}
                          className={account.status === "DISABLED" ? "text-green-600" : "text-yellow-600"}
                        >
                          {account.status === "DISABLED" ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              启用账号
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              禁用账号
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(account)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除账号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <EditAccountDialog
        account={editAccount}
        open={!!editAccount}
        onOpenChange={(open) => !open && setEditAccount(null)}
        onSuccess={onUpdate}
      />
    </>
  )
}
