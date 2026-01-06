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
  Instagram,
  Youtube,
  AtSign,
  Calendar,
  Play,
  ExternalLink,
  Send,
  Save,
  Trash2,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  PublishTask,
  PublishPlatform,
  PublishMode,
  YouTubePrivacyStatus,
  YouTubeCategory,
  YouTubePlaylist,
} from "@/types/publish"
import {
  PLATFORM_CONFIGS,
  STATUS_CONFIGS,
  MODE_CONFIGS,
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
  const [activeTab, setActiveTab] = useState<string>("")

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

        await fetch(`/api/publish/${task.id}/platform-content`, {
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
      }
      onUpdate?.()
    } catch (error) {
      console.error("Save failed:", error)
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
        const error = await response.json()
        throw new Error(error.error || "发布失败")
      }

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

      {/* 发布设置（只读展示） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">发布设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Object.keys(MODE_CONFIGS) as PublishMode[]).map((mode) => {
              const config = MODE_CONFIGS[mode]
              const isSelected = task.mode === mode
              return (
                <div
                  key={mode}
                  className={cn(
                    "flex items-start space-x-3 rounded-lg p-2",
                    isSelected && "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded-full border-2",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  />
                  <div className="space-y-1">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        !isSelected && "text-muted-foreground"
                      )}
                    >
                      {config.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 排期时间显示 */}
          {task.mode === "SCHEDULED" && task.scheduledAt && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                排期时间: {formatDateTime(task.scheduledAt)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-3">
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

        {isEditable && (
          <Button
            variant="outline"
            className="flex-1"
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
