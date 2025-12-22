"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createUser } from "@/app/(dashboard)/admin/users/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          创建中...
        </>
      ) : (
        "创建用户"
      )}
    </Button>
  )
}

interface AddUserDialogProps {
  children: React.ReactNode
}

export function AddUserDialog({ children }: AddUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(createUser, {})

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 需要在成功后关闭对话框
      setOpen(false)
    }
  }, [state.success])

  const getError = (field: string): string | undefined => {
    if (typeof state.error === "object" && state.error !== null) {
      return (state.error as Record<string, string[]>)[field]?.[0]
    }
    return undefined
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加用户</DialogTitle>
          <DialogDescription>创建新的系统用户账号</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">用户名</Label>
            <Input id="name" name="name" placeholder="请输入用户名" required />
            {getError("name") && (
              <p className="text-sm text-destructive">{getError("name")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
            />
            {getError("email") && (
              <p className="text-sm text-destructive">{getError("email")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="至少6个字符"
              required
            />
            {getError("password") && (
              <p className="text-sm text-destructive">{getError("password")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">角色</Label>
            <Select name="role" defaultValue="OPERATOR">
              <SelectTrigger>
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPERATOR">运营</SelectItem>
                <SelectItem value="ADMIN">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {typeof state.error === "string" && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
