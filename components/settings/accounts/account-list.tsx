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
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SocialAccount } from "@/types/social-account"
import type { PublishPlatform } from "@/types/publish"
import { ACCOUNT_STATUS_CONFIGS } from "@/types/social-account"
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
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.accountName}</span>
                        </div>
                        {account.accountUrl && (
                          <a
                            href={account.accountUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            查看主页
                          </a>
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
