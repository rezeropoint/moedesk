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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { updateUser } from "@/app/(dashboard)/admin/users/actions"

interface User {
  id: string
  email: string
  name: string
  role: "ADMIN" | "OPERATOR"
  isActive: boolean
}

interface EditUserDialogProps {
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
          保存中...
        </>
      ) : (
        "保存修改"
      )}
    </Button>
  )
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const updateUserWithId = user
    ? updateUser.bind(null, user.id)
    : async () => ({ error: "无效用户" })

  const [state, formAction] = useActionState(updateUserWithId, {})

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
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>修改用户 {user.email} 的信息</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">用户名</Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={user.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">角色</Label>
            <Select name="role" defaultValue={user.role}>
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
