"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Users, Loader2, Instagram, Youtube, AtSign, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

/** OAuth 错误消息映射 */
const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "请先登录",
  missing_params: "授权参数缺失，请重试",
  invalid_state: "授权验证失败，请重试",
  config_error: "OAuth 配置不完整，请联系管理员",
  token_exchange_failed: "获取授权令牌失败，请重试",
  channel_fetch_failed: "获取 YouTube 频道信息失败",
  userinfo_fetch_failed: "获取 Google 账户信息失败",
  no_channel: "未找到 YouTube 频道，请确认账号已创建频道",
  internal_error: "服务器错误，请稍后重试",
  access_denied: "授权已取消",
  session_expired: "授权已过期，请重新授权",
  cancelled: "已取消频道选择",
}

/** 成功消息映射 */
const SUCCESS_MESSAGES: Record<string, string> = {
  youtube_connected: "YouTube 频道授权成功！",
  google_connected_no_channel: "Google 账号已绑定，但您还未创建 YouTube 频道",
}

/** 从 URL 参数解析初始消息 */
function getInitialMessage(): { type: "success" | "error"; text: string } | null {
  if (typeof window === "undefined") return null

  const params = new URLSearchParams(window.location.search)
  const success = params.get("success")
  const error = params.get("error")

  // 清除 URL 参数
  if (success || error) {
    window.history.replaceState({}, "", "/settings/accounts")
  }

  if (success) {
    const channelsMatch = success.match(/^youtube_connected_(\d+)_channels$/)
    if (channelsMatch) {
      return { type: "success", text: `成功绑定 ${channelsMatch[1]} 个 YouTube 频道！` }
    }
    return { type: "success", text: SUCCESS_MESSAGES[success] || "操作成功！" }
  }

  if (error) {
    return { type: "error", text: ERROR_MESSAGES[error] || `授权失败：${error}` }
  }

  return null
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(getInitialMessage)

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
      {/* OAuth 回调消息提示 */}
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
          className={message.type === "success" ? "border-green-500 bg-green-50 text-green-700" : ""}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription className="flex items-center justify-between">
            {message.text}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setMessage(null)}
            >
              关闭
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
