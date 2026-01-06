"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Youtube, Users, Video, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { YouTubeChannel } from "@/lib/youtube"

interface ChannelSelectorProps {
  channels: YouTubeChannel[]
  userEmail?: string
  /** 单选模式（刷新频道时使用） */
  singleSelect?: boolean
  /** 更新现有账号 ID（刷新模式） */
  updatingAccountId?: string
}

/** 格式化数字（简化显示） */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return num.toString()
}

export function ChannelSelector({
  channels,
  singleSelect = false,
  updatingAccountId,
}: ChannelSelectorProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleChannel = (channelId: string) => {
    if (singleSelect) {
      // 单选模式：切换选中状态
      setSelectedIds((prev) =>
        prev.includes(channelId) ? [] : [channelId]
      )
    } else {
      // 多选模式
      setSelectedIds((prev) =>
        prev.includes(channelId)
          ? prev.filter((id) => id !== channelId)
          : [...prev, channelId]
      )
    }
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/oauth/youtube/confirm-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelIds: selectedIds,
          updatingAccountId, // 刷新模式下传递要更新的账号 ID
        }),
      })

      if (response.ok) {
        if (updatingAccountId) {
          // 刷新模式：返回账号列表，显示成功消息
          router.push("/settings/accounts?success=channel_refreshed")
        } else {
          // 新绑定模式
          const count = selectedIds.length
          router.push(
            `/settings/accounts?success=youtube_connected_${count}_channels`
          )
        }
      } else {
        const result = await response.json()
        setError(result.error || "绑定失败，请重试")
      }
    } catch (err) {
      console.error("确认频道失败:", err)
      setError("网络错误，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/settings/accounts?error=cancelled")
  }

  // 渲染单个频道卡片内容
  const renderChannelContent = (channel: YouTubeChannel) => {
    const subscriberCount = channel.statistics.hiddenSubscriberCount
      ? 0
      : parseInt(channel.statistics.subscriberCount) || 0
    const videoCount = parseInt(channel.statistics.videoCount) || 0
    const viewCount = parseInt(channel.statistics.viewCount) || 0

    return (
      <>
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={channel.snippet.thumbnails.default.url}
            alt={channel.snippet.title}
          />
          <AvatarFallback>
            <Youtube className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="font-medium">{channel.snippet.title}</div>
          {channel.snippet.customUrl && (
            <div className="text-sm text-muted-foreground">
              {channel.snippet.customUrl}
            </div>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatNumber(subscriberCount)} 订阅
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {formatNumber(videoCount)} 视频
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(viewCount)} 播放
            </span>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* 频道列表 */}
      {singleSelect ? (
        // 单选模式
        <RadioGroup
          value={selectedIds[0] || ""}
          onValueChange={(value) => setSelectedIds([value])}
          className="space-y-3"
        >
          {channels.map((channel) => {
            const isSelected = selectedIds.includes(channel.id)

            return (
              <Card
                key={channel.id}
                className={cn(
                  "cursor-pointer transition-colors hover:border-primary/50",
                  isSelected && "border-primary bg-primary/5"
                )}
                onClick={() => toggleChannel(channel.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <RadioGroupItem
                    value={channel.id}
                    className="pointer-events-none"
                  />
                  {renderChannelContent(channel)}
                </CardContent>
              </Card>
            )
          })}
        </RadioGroup>
      ) : (
        // 多选模式
        <div className="space-y-3">
          {channels.map((channel) => {
            const isSelected = selectedIds.includes(channel.id)

            return (
              <Card
                key={channel.id}
                className={cn(
                  "cursor-pointer transition-colors hover:border-primary/50",
                  isSelected && "border-primary bg-primary/5"
                )}
                onClick={() => toggleChannel(channel.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleChannel(channel.id)}
                    className="pointer-events-none"
                  />
                  {renderChannelContent(channel)}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* 提示信息 */}
      <p className="text-sm text-muted-foreground">
        {singleSelect
          ? `已选择 ${selectedIds.length} 个频道。`
          : `已选择 ${selectedIds.length} 个频道。每个频道将作为独立账号绑定。`}
      </p>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedIds.length === 0 || isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {singleSelect
            ? "确认绑定"
            : `绑定选中的 ${selectedIds.length} 个频道`}
        </Button>
      </div>
    </div>
  )
}
