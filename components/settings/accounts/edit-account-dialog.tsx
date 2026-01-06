"use client"

import { useEffect } from "react"
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
import { Loader2, Instagram, Youtube, AtSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SocialAccount } from "@/types/social-account"
import type { PublishPlatform } from "@/types/publish"
import { PLATFORM_CONFIGS } from "@/types/publish"
import { useState } from "react"

const platformIcons: Record<PublishPlatform, React.ElementType> = {
  INSTAGRAM: Instagram,
  THREADS: AtSign,
  YOUTUBE: Youtube,
}

const formSchema = z.object({
  accountName: z.string().min(1, "账号名称不能为空").max(100, "账号名称最多100字符"),
  accountUrl: z.string().url("请输入有效的 URL").optional().or(z.literal("")),
  avatarUrl: z.string().url("请输入有效的头像 URL").optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

interface EditAccountDialogProps {
  account: SocialAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
  onSuccess,
}: EditAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountName: "",
      accountUrl: "",
      avatarUrl: "",
    },
  })

  // 当 account 变化时重置表单
  useEffect(() => {
    if (account) {
      form.reset({
        accountName: account.accountName,
        accountUrl: account.accountUrl || "",
        avatarUrl: account.avatarUrl || "",
      })
    }
  }, [account, form])

  const onSubmit = async (data: FormData) => {
    if (!account) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        onOpenChange(false)
        onSuccess()
      } else {
        const result = await response.json()
        form.setError("accountName", { message: result.error || "更新失败" })
      }
    } catch (error) {
      console.error("Update account failed:", error)
      form.setError("accountName", { message: "网络错误，请重试" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!account) return null

  const PlatformIcon = platformIcons[account.platform]
  const platformConfig = PLATFORM_CONFIGS[account.platform]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlatformIcon className={cn("h-5 w-5", platformConfig.colorClass)} />
            编辑账号
          </DialogTitle>
          <DialogDescription>
            修改 {platformConfig.name} 账号信息
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账号名称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                    <Input placeholder="https://..." {...field} />
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
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
