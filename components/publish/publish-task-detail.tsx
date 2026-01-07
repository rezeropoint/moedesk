"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Instagram,
  Youtube,
  AtSign,
  Play,
  ExternalLink,
  Send,
  Save,
  Trash2,
  Loader2,
  Clock,
  CalendarClock,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type {
  PublishTask,
  PublishPlatform,
  YouTubePrivacyStatus,
  YouTubeCategory,
  YouTubePlaylist,
} from "@/types/publish"
import {
  PLATFORM_CONFIGS,
  STATUS_CONFIGS,
  YOUTUBE_PRIVACY_CONFIGS,
} from "@/types/publish"

interface PublishTaskDetailProps {
  task: PublishTask | null
  onUpdate?: () => void
  onDelete?: (taskId: string) => void
}

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// 平台文案表单状态
interface PlatformContentForm {
  title: string
  description: string
  hashtags: string
  // YouTube 专属配置
  youtubePrivacyStatus: YouTubePrivacyStatus
  youtubeCategoryId: string
  youtubePlaylistIds: string[]
  youtubeThumbnailUrl: string
}

export function PublishTaskDetail({
  task,
  onUpdate,
  onDelete,
}: PublishTaskDetailProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingSchedule, setIsTogglingSchedule] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")

  // 排期时间状态
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined)

  // 平台文案表单状态
  const [platformForms, setPlatformForms] = useState<
    Record<string, PlatformContentForm>
  >({})

  // YouTube 分类和播放列表
  const [youtubeCategories, setYoutubeCategories] = useState<YouTubeCategory[]>([])
  const [youtubePlaylists, setYoutubePlaylists] = useState<YouTubePlaylist[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false)

  // 任务变化时初始化表单状态
  useEffect(() => {
    if (task) {
      const forms: Record<string, PlatformContentForm> = {}
      for (const platform of task.platforms) {
        const content = task.platformContents.find(
          (c) => c.platform === platform
        )
        forms[platform] = {
          title: content?.title || "",
          description: content?.description || "",
          hashtags: content?.hashtags.join(" ") || "",
          // YouTube 专属配置
          youtubePrivacyStatus: (content?.youtubePrivacyStatus as YouTubePrivacyStatus) || "public",
          youtubeCategoryId: content?.youtubeCategoryId || "",
          youtubePlaylistIds: content?.youtubePlaylistIds || [],
          youtubeThumbnailUrl: content?.youtubeThumbnailUrl || "",
        }
      }
      setPlatformForms(forms)
      setActiveTab(task.platforms[0] || "")
      // 初始化排期时间
      setScheduledAt(task.scheduledAt ? new Date(task.scheduledAt) : undefined)
    }
  }, [task])

  // 加载 YouTube 分类（当任务包含 YouTube 平台时）
  useEffect(() => {
    if (task?.platforms.includes("YOUTUBE") && youtubeCategories.length === 0) {
      setIsLoadingCategories(true)
      fetch("/api/youtube/categories")
        .then((res) => res.json())
        .then((data) => setYoutubeCategories(data.data || []))
        .catch(console.error)
        .finally(() => setIsLoadingCategories(false))
    }
  }, [task?.platforms, youtubeCategories.length])

  // 加载 YouTube 播放列表（当任务包含 YouTube 平台且有关联账号时）
  useEffect(() => {
    if (task?.platforms.includes("YOUTUBE") && task.accounts?.length) {
      const youtubeAccount = task.accounts.find((a) => a.platform === "YOUTUBE")
      if (youtubeAccount) {
        setIsLoadingPlaylists(true)
        fetch(`/api/youtube/playlists?accountId=${youtubeAccount.id}`)
          .then((res) => res.json())
          .then((data) => setYoutubePlaylists(data.data || []))
          .catch(console.error)
          .finally(() => setIsLoadingPlaylists(false))
      }
    }
  }, [task?.platforms, task?.accounts])

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>选择一个任务查看详情</p>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIGS[task.status]

  // 判断是否可编辑
  const isEditable = ["DRAFT", "SCHEDULED"].includes(task.status)
  // 判断是否可发布
  const canPublish = ["DRAFT", "SCHEDULED", "PARTIAL_FAILED"].includes(
    task.status
  )
  // 判断是否可删除
  const canDelete = ["DRAFT", "SCHEDULED", "FAILED", "PARTIAL_FAILED"].includes(
    task.status
  )

  // 更新平台文案表单
  const updatePlatformForm = (
    platform: string,
    field: keyof PlatformContentForm,
    value: string
  ) => {
    setPlatformForms((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }))
  }

  // 保存文案
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 保存每个平台的文案
      for (const platform of task.platforms) {
        const form = platformForms[platform]
        if (!form) continue

        const response = await fetch(`/api/publish/${task.id}/platform-content`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            title: form.title || null,
            description: form.description || null,
            hashtags: form.hashtags
              .split(/\s+/)
              .filter(Boolean)
              .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
            // YouTube 专属配置
            ...(platform === "YOUTUBE" && {
              youtubePrivacyStatus: form.youtubePrivacyStatus || null,
              youtubeCategoryId: form.youtubeCategoryId || null,
              youtubePlaylistIds: form.youtubePlaylistIds || [],
              youtubeThumbnailUrl: form.youtubeThumbnailUrl || null,
            }),
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "保存失败")
        }
      }
      toast.success("文案保存成功")
      onUpdate?.()
    } catch (error) {
      console.error("Save failed:", error)
      toast.error("保存失败", {
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 触发发布
  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      // 先保存文案
      await handleSave()

      // 触发发布
      const response = await fetch(`/api/publish/${task.id}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        let errorMsg = "发布失败"
        try {
          const error = await response.json()
          errorMsg = error.details || error.error || errorMsg
        } catch {
          // 响应不是 JSON，可能是网络错误或服务不可用
          errorMsg = `服务响应异常 (${response.status})`
        }
        toast.error("发布失败", { description: errorMsg })
        throw new Error(errorMsg)
      }

      toast.success("发布任务已触发")
      onUpdate?.()
    } catch (error) {
      console.error("Publish failed:", error)
    } finally {
      setIsPublishing(false)
    }
  }

  // 删除任务
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/publish/${task.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "删除失败")
      }

      onDelete?.(task.id)
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // 启用定时发布（DRAFT → SCHEDULED）
  const handleEnableSchedule = async () => {
    if (!scheduledAt) return

    setIsTogglingSchedule(true)
    try {
      // 先保存文案
      await handleSave()

      // 更新任务状态为 SCHEDULED
      const response = await fetch(`/api/publish/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SCHEDULED",
          scheduledAt: scheduledAt.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "启用定时失败")
      }

      toast.success("定时发布已启用", {
        description: `将于 ${format(scheduledAt, "yyyy-MM-dd HH:mm", { locale: zhCN })} 自动发布`,
      })
      onUpdate?.()
    } catch (error) {
      console.error("Enable schedule failed:", error)
      toast.error("启用定时失败", {
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setIsTogglingSchedule(false)
    }
  }

  // 取消定时发布（SCHEDULED → DRAFT）
  const handleCancelSchedule = async () => {
    setIsTogglingSchedule(true)
    try {
      const response = await fetch(`/api/publish/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "取消定时失败")
      }

      setScheduledAt(undefined)
      toast.success("定时发布已取消")
      onUpdate?.()
    } catch (error) {
      console.error("Cancel schedule failed:", error)
      toast.error("取消定时失败", {
        description: error instanceof Error ? error.message : "未知错误",
      })
    } finally {
      setIsTogglingSchedule(false)
    }
  }

  return (
    <div className="space-y-4 overflow-auto">
      {/* 平台选择（只读展示） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">目标平台</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(PLATFORM_CONFIGS) as PublishPlatform[]).map(
              (platform) => {
                const config = PLATFORM_CONFIGS[platform]
                const Icon = platformIcons[platform]
                const isSelected = task.platforms.includes(platform)

                return (
                  <div
                    key={platform}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border opacity-50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.colorClass)} />
                    <span className="text-sm">{config.name}</span>
                  </div>
                )
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* 内容预览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">内容预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* 封面/视频缩略图 */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {task.coverUrl ? (
                <Image
                  src={task.coverUrl}
                  alt={task.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {task.videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 space-y-2">
              <h3 className="font-medium">{task.title}</h3>
              {task.seriesTitle && (
                <p className="text-sm text-muted-foreground">
                  系列: {task.seriesTitle}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  创建于 {formatDateTime(task.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文案编辑（按平台分 Tab） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">平台文案</CardTitle>
        </CardHeader>
        <CardContent>
          {task.platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">请先选择目标平台</p>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start">
                {task.platforms.map((platform) => {
                  const config = PLATFORM_CONFIGS[platform]
                  const Icon = platformIcons[platform]
                  return (
                    <TabsTrigger
                      key={platform}
                      value={platform}
                      className="gap-1.5"
                    >
                      <Icon className={cn("h-3.5 w-3.5", config.colorClass)} />
                      {config.name}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {task.platforms.map((platform) => {
                const config = PLATFORM_CONFIGS[platform]
                const form = platformForms[platform] || {
                  title: "",
                  description: "",
                  hashtags: "",
                }

                return (
                  <TabsContent key={platform} value={platform} className="mt-4">
                    <div className="space-y-4">
                      {/* 标题（YouTube 需要） */}
                      {config.maxTitleLength > 0 && (
                        <div className="space-y-2">
                          <Label>标题</Label>
                          <Input
                            placeholder={`输入 ${config.name} 标题...`}
                            value={form.title}
                            onChange={(e) =>
                              updatePlatformForm(
                                platform,
                                "title",
                                e.target.value
                              )
                            }
                            maxLength={config.maxTitleLength}
                            disabled={!isEditable}
                          />
                          <p className="text-xs text-muted-foreground">
                            {form.title.length}/{config.maxTitleLength} 字符
                          </p>
                        </div>
                      )}

                      {/* 描述 */}
                      <div className="space-y-2">
                        <Label>描述</Label>
                        <Textarea
                          placeholder={`输入 ${config.name} 描述...`}
                          value={form.description}
                          onChange={(e) =>
                            updatePlatformForm(
                              platform,
                              "description",
                              e.target.value
                            )
                          }
                          maxLength={config.maxDescLength}
                          rows={4}
                          disabled={!isEditable}
                        />
                        <p className="text-xs text-muted-foreground">
                          {form.description.length}/{config.maxDescLength} 字符
                        </p>
                      </div>

                      {/* Hashtags */}
                      <div className="space-y-2">
                        <Label>Hashtags</Label>
                        <Input
                          placeholder="#anime #manga"
                          value={form.hashtags}
                          onChange={(e) =>
                            updatePlatformForm(
                              platform,
                              "hashtags",
                              e.target.value
                            )
                          }
                          disabled={!isEditable}
                        />
                        <p className="text-xs text-muted-foreground">
                          最多 {config.maxHashtags} 个标签（以空格分隔）
                        </p>
                      </div>

                      {/* YouTube 高级设置 */}
                      {platform === "YOUTUBE" && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-sm font-medium">YouTube 高级设置</h4>

                          {/* 隐私状态 */}
                          <div className="space-y-2">
                            <Label>隐私状态</Label>
                            <Select
                              value={form.youtubePrivacyStatus}
                              onValueChange={(v) =>
                                setPlatformForms((prev) => ({
                                  ...prev,
                                  [platform]: {
                                    ...prev[platform],
                                    youtubePrivacyStatus: v as YouTubePrivacyStatus,
                                  },
                                }))
                              }
                              disabled={!isEditable}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(YOUTUBE_PRIVACY_CONFIGS) as YouTubePrivacyStatus[]).map(
                                  (status) => {
                                    const privacyConfig = YOUTUBE_PRIVACY_CONFIGS[status]
                                    return (
                                      <SelectItem key={status} value={status}>
                                        {privacyConfig.label} - {privacyConfig.description}
                                      </SelectItem>
                                    )
                                  }
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 视频分类 */}
                          <div className="space-y-2">
                            <Label>视频分类</Label>
                            {isLoadingCategories ? (
                              <Skeleton className="h-10 w-full" />
                            ) : (
                              <Select
                                value={form.youtubeCategoryId}
                                onValueChange={(v) =>
                                  setPlatformForms((prev) => ({
                                    ...prev,
                                    [platform]: {
                                      ...prev[platform],
                                      youtubeCategoryId: v,
                                    },
                                  }))
                                }
                                disabled={!isEditable}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择分类" />
                                </SelectTrigger>
                                <SelectContent>
                                  {youtubeCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* 播放列表 */}
                          <div className="space-y-2">
                            <Label>添加到播放列表</Label>
                            {isLoadingPlaylists ? (
                              <Skeleton className="h-20 w-full" />
                            ) : youtubePlaylists.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">
                                暂无播放列表
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {youtubePlaylists.map((playlist) => (
                                  <div
                                    key={playlist.id}
                                    className="flex items-center gap-2"
                                  >
                                    <Checkbox
                                      checked={form.youtubePlaylistIds.includes(playlist.id)}
                                      onCheckedChange={(checked) => {
                                        setPlatformForms((prev) => {
                                          const current = prev[platform]?.youtubePlaylistIds || []
                                          const newIds = checked
                                            ? [...current, playlist.id]
                                            : current.filter((id) => id !== playlist.id)
                                          return {
                                            ...prev,
                                            [platform]: {
                                              ...prev[platform],
                                              youtubePlaylistIds: newIds,
                                            },
                                          }
                                        })
                                      }}
                                      disabled={!isEditable}
                                    />
                                    <span className="text-sm">{playlist.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({playlist.itemCount} 个视频)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 自定义缩略图 */}
                          <div className="space-y-2">
                            <Label>自定义缩略图</Label>
                            <Input
                              type="url"
                              placeholder="输入缩略图 URL..."
                              value={form.youtubeThumbnailUrl}
                              onChange={(e) =>
                                setPlatformForms((prev) => ({
                                  ...prev,
                                  [platform]: {
                                    ...prev[platform],
                                    youtubeThumbnailUrl: e.target.value,
                                  },
                                }))
                              }
                              disabled={!isEditable}
                            />
                            <p className="text-xs text-muted-foreground">
                              推荐尺寸：1280x720，支持 JPG、PNG 格式
                            </p>
                            {form.youtubeThumbnailUrl && (
                              <div className="relative w-32 aspect-video rounded overflow-hidden">
                                <Image
                                  src={form.youtubeThumbnailUrl}
                                  alt="缩略图预览"
                                  fill
                                  className="object-cover"
                                  sizes="128px"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* 发布设置 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">发布设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 当前状态显示 */}
          <div className="flex items-center gap-2">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            {task.status === "SCHEDULED" && task.scheduledAt && (
              <span className="text-sm text-muted-foreground">
                将于 {formatDateTime(task.scheduledAt)} 自动发布
              </span>
            )}
          </div>

          {/* 排期时间设置（仅 DRAFT 状态可编辑） */}
          {isEditable && (
            <div className="space-y-3">
              <Label>排期时间</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !scheduledAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      {scheduledAt
                        ? format(scheduledAt, "yyyy-MM-dd HH:mm", { locale: zhCN })
                        : "选择发布时间"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={scheduledAt}
                      onSelect={setScheduledAt}
                      disabled={(date) => date < new Date()}
                      locale={zhCN}
                    />
                    {/* 时间选择器 */}
                    <div className="border-t p-3">
                      <Label className="text-xs">选择时间</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="time"
                          className="w-full"
                          value={scheduledAt ? format(scheduledAt, "HH:mm") : ""}
                          onChange={(e) => {
                            if (scheduledAt && e.target.value) {
                              const [hours, minutes] = e.target.value.split(":").map(Number)
                              const newDate = new Date(scheduledAt)
                              newDate.setHours(hours, minutes)
                              setScheduledAt(newDate)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {scheduledAt && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setScheduledAt(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                设置时间后点击「启用定时」，到期后将自动触发发布
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        {/* 删除按钮 */}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除任务「{task.title}」吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* 保存文案按钮 */}
        {isEditable && (
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存文案
          </Button>
        )}

        {/* 定时相关按钮 */}
        {task.status === "DRAFT" && scheduledAt && (
          <Button
            variant="outline"
            onClick={handleEnableSchedule}
            disabled={isTogglingSchedule || isSaving}
          >
            {isTogglingSchedule ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            启用定时
          </Button>
        )}

        {task.status === "SCHEDULED" && (
          <Button
            variant="outline"
            onClick={handleCancelSchedule}
            disabled={isTogglingSchedule}
          >
            {isTogglingSchedule ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            取消定时
          </Button>
        )}

        {/* 立即发布按钮 */}
        {canPublish && (
          <Button
            className="flex-1 gap-2"
            onClick={handlePublish}
            disabled={isPublishing || isSaving}
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {task.status === "PARTIAL_FAILED" ? "重试发布" : "立即发布"}
          </Button>
        )}
      </div>

      {/* 发布记录（如果有） */}
      {task.records && task.records.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">发布记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.records.map((record) => {
                const platformConfig = PLATFORM_CONFIGS[record.platform]
                const Icon = platformIcons[record.platform]
                const recordStatus = STATUS_CONFIGS[record.status]

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn("h-4 w-4", platformConfig.colorClass)}
                      />
                      <span className="text-sm">{platformConfig.name}</span>
                      <Badge variant={recordStatus.variant} className="text-xs">
                        {recordStatus.label}
                      </Badge>
                      {record.errorMessage && (
                        <span className="text-xs text-destructive">
                          {record.errorMessage}
                        </span>
                      )}
                    </div>
                    {record.externalUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1"
                        asChild
                      >
                        <a
                          href={record.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                          查看
                        </a>
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
