"use client"

import { useEffect, useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Instagram, Youtube, AtSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AccountBrief } from "@/types/social-account"
import type { PublishPlatform } from "@/types/publish"
import { PLATFORM_CONFIGS } from "@/types/publish"

interface AccountSelectorProps {
  platform: PublishPlatform
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

export function AccountSelector({ platform, selectedIds, onChange }: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<AccountBrief[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const initializedRef = useRef(false)

  useEffect(() => {
    async function fetchAccounts() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/accounts/by-platform/${platform}?activeOnly=true`)
        if (response.ok) {
          const result = await response.json()
          setAccounts(result.data)
          initializedRef.current = true
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAccounts()
  }, [platform]) // 只依赖 platform

  const handleToggle = (accountId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedIds, accountId])
    } else {
      onChange(selectedIds.filter((id) => id !== accountId))
    }
  }

  const platformConfig = PLATFORM_CONFIGS[platform]
  const Icon = platformIcons[platform]

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("h-4 w-4", platformConfig.colorClass)} />
          <span className="text-sm font-medium">{platformConfig.name} 账号</span>
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("h-4 w-4", platformConfig.colorClass)} />
          <span className="text-sm font-medium">{platformConfig.name} 账号</span>
        </div>
        <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
          暂无可用账号，请先在「账号管理」中添加
        </div>
      </div>
    )
  }

  // 计算可选账号数量（排除无频道的 YouTube 账号）
  const selectableAccounts = accounts.filter(a => a.hasChannel !== false)
  const selectedCount = selectedIds.filter(id => selectableAccounts.some(a => a.id === id)).length

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", platformConfig.colorClass)} />
        <span className="text-sm font-medium">{platformConfig.name} 账号</span>
        <span className="text-xs text-muted-foreground">
          （已选 {selectedCount}/{selectableAccounts.length}）
        </span>
      </div>
      <div className="space-y-2">
        {accounts.map((account) => {
          // YouTube 账号无频道时禁用选择
          const isDisabled = account.hasChannel === false

          return (
            <div
              key={account.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                isDisabled
                  ? "cursor-not-allowed opacity-60 bg-muted/30 border-border"
                  : selectedIds.includes(account.id)
                    ? "cursor-pointer border-primary bg-primary/5"
                    : "cursor-pointer border-border hover:bg-muted/50"
              )}
              onClick={() => !isDisabled && handleToggle(account.id, !selectedIds.includes(account.id))}
            >
              <Checkbox
                checked={selectedIds.includes(account.id)}
                disabled={isDisabled}
                onCheckedChange={(checked) => handleToggle(account.id, !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <Avatar className="h-8 w-8">
                <AvatarImage src={account.avatarUrl || undefined} />
                <AvatarFallback>
                  {account.accountName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-medium">{account.accountName}</span>
                {isDisabled && (
                  <Badge variant="outline" className="text-status-warning border-status-warning/50 text-xs">
                    待创建频道
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
