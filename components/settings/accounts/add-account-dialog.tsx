"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Instagram, Youtube, AtSign, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PublishPlatform } from "@/types/publish"
import { PLATFORM_CONFIGS } from "@/types/publish"

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

const formSchema = z.object({
  platform: z.enum(["INSTAGRAM", "THREADS", "YOUTUBE"]),
  accountName: z.string().min(1, "账号名称不能为空").max(100, "账号名称最多100字符"),
  accountUrl: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  avatarUrl: z.string().url("请输入有效的头像 URL").optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

interface AddAccountDialogProps {
  onSuccess: () => void
}

export function AddAccountDialog({ onSuccess }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"manual" | "oauth">("manual")

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: "INSTAGRAM",
      accountName: "",
      accountUrl: "",
      avatarUrl: "",
    },
  })

  const selectedPlatform = form.watch("platform") as PublishPlatform
  const PlatformIcon = platformIcons[selectedPlatform]
  const platformConfig = PLATFORM_CONFIGS[selectedPlatform]

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setOpen(false)
        form.reset()
        onSuccess()
      } else {
        const result = await response.json()
        form.setError("accountName", { message: result.error || "创建失败" })
      }
    } catch (error) {
      console.error("Create account failed:", error)
      form.setError("accountName", { message: "网络错误，请重试" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          添加账号
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加社媒账号</DialogTitle>
          <DialogDescription>
            绑定社媒平台账号，用于发布内容
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "manual" | "oauth")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手动填写</TabsTrigger>
            <TabsTrigger value="oauth">OAuth 授权</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>平台</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择平台" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(PLATFORM_CONFIGS) as PublishPlatform[]).map((platform) => {
                            const config = PLATFORM_CONFIGS[platform]
                            const Icon = platformIcons[platform]
                            return (
                              <SelectItem key={platform} value={platform}>
                                <div className="flex items-center gap-2">
                                  <Icon className={cn("h-4 w-4", config.colorClass)} />
                                  {config.name}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>账号名称</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <PlatformIcon className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                            platformConfig.colorClass
                          )} />
                          <Input
                            placeholder={`如 @moedesk_${selectedPlatform.toLowerCase()}`}
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        用于在发布任务中识别此账号
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>主页链接（可选）</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>头像链接（可选）</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    添加
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="oauth" className="mt-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">OAuth 授权即将上线</h3>
              <p className="text-sm text-muted-foreground max-w-[300px]">
                一键授权连接社媒账号，自动获取账号信息并实现发布功能。
              </p>
              <div className="flex gap-3 mt-6">
                {(Object.keys(PLATFORM_CONFIGS) as PublishPlatform[]).map((platform) => {
                  const Icon = platformIcons[platform]
                  const config = PLATFORM_CONFIGS[platform]
                  return (
                    <div
                      key={platform}
                      className="p-3 rounded-lg border bg-card opacity-50"
                    >
                      <Icon className={cn("h-6 w-6", config.colorClass)} />
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
