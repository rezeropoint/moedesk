"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Users, Loader2, Instagram, Youtube, AtSign } from "lucide-react"
import { AccountList } from "@/components/settings/accounts/account-list"
import { AddAccountDialog } from "@/components/settings/accounts/add-account-dialog"
import type { SocialAccount, AccountStats } from "@/types/social-account"
import type { PublishPlatform } from "@/types/publish"
import { PLATFORM_CONFIGS } from "@/types/publish"
import { cn } from "@/lib/utils"

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAccounts = useCallback(async (platform?: string) => {
    try {
      const url = platform && platform !== "all"
        ? `/api/accounts?platform=${platform}`
        : "/api/accounts"
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setAccounts(result.data.items)
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/accounts/stats")
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      await Promise.all([fetchAccounts(), fetchStats()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchAccounts, fetchStats])

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab)
    await fetchAccounts(tab)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchAccounts(activeTab), fetchStats()])
    setIsRefreshing(false)
  }

  const handleAccountCreated = () => {
    handleRefresh()
  }

  const handleAccountUpdate = () => {
    handleRefresh()
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">账号管理</h1>
            <p className="text-muted-foreground">
              管理已绑定的社媒平台账号
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
            />
            刷新
          </Button>
          <AddAccountDialog onSuccess={handleAccountCreated} />
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">总账号数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-sm text-muted-foreground">正常账号</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <p className="text-sm text-muted-foreground">已过期</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-500">{stats.disabled}</div>
              <p className="text-sm text-muted-foreground">已禁用</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 账号列表（按平台分 Tab） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">已绑定账号</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              {(Object.keys(PLATFORM_CONFIGS) as PublishPlatform[]).map((platform) => {
                const config = PLATFORM_CONFIGS[platform]
                const Icon = platformIcons[platform]
                const count = stats?.byPlatform[platform] || 0
                return (
                  <TabsTrigger key={platform} value={platform} className="gap-1.5">
                    <Icon className={cn("h-4 w-4", config.colorClass)} />
                    {config.name}
                    {count > 0 && (
                      <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <AccountList
                accounts={accounts}
                onUpdate={handleAccountUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
