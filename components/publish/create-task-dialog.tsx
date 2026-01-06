"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, Calendar as CalendarIcon, Instagram, Youtube, AtSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import type { PublishPlatform, PublishMode } from "@/types/publish"
import { PLATFORM_CONFIGS, MODE_CONFIGS } from "@/types/publish"

const formSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100字符"),
  videoUrl: z.string().url("请输入有效的视频 URL").optional().or(z.literal("")),
  coverUrl: z.string().url("请输入有效的封面 URL").optional().or(z.literal("")),
  platforms: z
    .array(z.enum(["INSTAGRAM", "THREADS", "YOUTUBE"]))
    .min(1, "请至少选择一个平台"),
  mode: z.enum(["IMMEDIATE", "SCHEDULED", "MANUAL"]),
  scheduledAt: z.date().optional(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
      coverUrl: "",
      platforms: [],
      mode: "SCHEDULED",
      scheduledAt: undefined,
    },
  })

  const selectedMode = form.watch("mode")

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          scheduledAt: values.scheduledAt?.toISOString() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "创建失败")
      }

      setOpen(false)
      form.reset()
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

            {/* 发布模式 */}
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>发布模式</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-3 mt-2"
                    >
                      {(Object.keys(MODE_CONFIGS) as PublishMode[]).map((mode) => {
                        const config = MODE_CONFIGS[mode]
                        return (
                          <div key={mode} className="flex items-start space-x-3">
                            <RadioGroupItem value={mode} id={`mode-${mode}`} />
                            <div className="space-y-0.5">
                              <label
                                htmlFor={`mode-${mode}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {config.label}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {config.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 排期时间（仅 SCHEDULED 模式显示） */}
            {selectedMode === "SCHEDULED" && (
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排期时间</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value
                              ? format(field.value, "yyyy-MM-dd HH:mm", {
                                  locale: zhCN,
                                })
                              : "选择发布时间"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          locale={zhCN}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      到达设定时间后自动触发发布
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isSubmitting ? "创建中..." : "创建任务"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
