"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { resetUserPassword } from "@/app/(dashboard)/admin/users/actions"

interface User {
  id: string
  email: string
  name: string
}

interface ResetPasswordDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          重置中...
        </>
      ) : (
        "重置密码"
      )}
    </Button>
  )
}

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const resetPasswordWithId = user
    ? resetUserPassword.bind(null, user.id)
    : async () => ({ error: "无效用户" })

  const [state, formAction] = useActionState(resetPasswordWithId, {})

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onOpenChange 保持稳定
  }, [state.success])

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重置密码</DialogTitle>
          <DialogDescription>
            为用户 {user.name} ({user.email}) 设置新密码
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              placeholder="至少6个字符"
              required
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            重置密码后，该用户当前的所有登录会话将被清除，需要使用新密码重新登录。
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
              onClick={() => onOpenChange(false)}
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
