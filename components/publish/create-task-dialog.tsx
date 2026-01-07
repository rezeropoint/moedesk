"use client"

import { useState, useCallback } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Instagram, Youtube, AtSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PublishPlatform } from "@/types/publish"
import { PLATFORM_CONFIGS } from "@/types/publish"
import { AccountSelector } from "@/components/settings/accounts/account-selector"

const formSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100字符"),
  videoUrl: z.string().url("请输入有效的视频 URL").optional().or(z.literal("")),
  coverUrl: z.string().url("请输入有效的封面 URL").optional().or(z.literal("")),
  platforms: z
    .array(z.enum(["INSTAGRAM", "THREADS", "YOUTUBE"]))
    .min(1, "请至少选择一个平台"),
})

type FormValues = z.infer<typeof formSchema>

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

interface CreateTaskDialogProps {
  onSuccess?: () => void
}

export function CreateTaskDialog({ onSuccess }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // 账号选择状态：{ platform: accountIds[] }
  const [platformAccounts, setPlatformAccounts] = useState<Record<string, string[]>>({})

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
      coverUrl: "",
      platforms: [],
    },
  })

  const selectedPlatforms = useWatch({ control: form.control, name: "platforms" })

  // 更新单个平台的账号选择
  const handleAccountsChange = useCallback((platform: PublishPlatform, accountIds: string[]) => {
    setPlatformAccounts(prev => ({ ...prev, [platform]: accountIds }))
  }, [])

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          videoUrl: values.videoUrl || undefined,
          coverUrl: values.coverUrl || undefined,
          platforms: values.platforms,
          platformAccounts: Object.keys(platformAccounts).length > 0 ? platformAccounts : undefined,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error("API Error Response:", response.status, text)
        const error = text ? JSON.parse(text) : { error: `请求失败 (${response.status})` }
        throw new Error(error.details || error.error || "创建失败")
      }

      setOpen(false)
      form.reset()
      setPlatformAccounts({})
      onSuccess?.()
    } catch (error) {
      console.error("Create task failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          新建发布任务
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建发布任务</DialogTitle>
          <DialogDescription>
            创建后在详情面板配置文案和发布设置
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 标题 */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内容标题 *</FormLabel>
                  <FormControl>
                    <Input placeholder="输入发布内容的标题..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 视频/封面 URL */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>视频 URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>封面 URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 目标平台 */}
            <FormField
              control={form.control}
              name="platforms"
              render={() => (
                <FormItem>
                  <FormLabel>目标平台 *</FormLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {(Object.keys(PLATFORM_CONFIGS) as PublishPlatform[]).map(
                      (platform) => {
                        const config = PLATFORM_CONFIGS[platform]
                        const Icon = platformIcons[platform]
                        return (
                          <FormField
                            key={platform}
                            control={form.control}
                            name="platforms"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes(platform)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...field.value, platform]
                                        : field.value.filter((v) => v !== platform)
                                      field.onChange(newValue)
                                    }}
                                  />
                                </FormControl>
                                <div className="flex items-center gap-1.5">
                                  <Icon className={cn("h-4 w-4", config.colorClass)} />
                                  <span className="text-sm font-medium">
                                    {config.name}
                                  </span>
                                </div>
                              </FormItem>
                            )}
                          />
                        )
                      }
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 账号选择（选择平台后显示） */}
            {selectedPlatforms.length > 0 && (
              <div className="space-y-4">
                <FormLabel>发布账号</FormLabel>
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  {selectedPlatforms.map((platform) => (
                    <AccountSelector
                      key={platform}
                      platform={platform}
                      selectedIds={platformAccounts[platform] || []}
                      onChange={(ids) => handleAccountsChange(platform, ids)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "创建中..." : "创建草稿"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
