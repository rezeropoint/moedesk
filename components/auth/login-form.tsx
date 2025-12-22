"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Loader2 } from "lucide-react"
import { loginAction } from "@/app/login/actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full bg-[#7c3aed] hover:bg-[#6d28d9]"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          登录中...
        </>
      ) : (
        "登录"
      )}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, { error: null })

  return (
    <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur">
      <CardHeader className="space-y-1 pb-4">
        <h2 className="text-xl font-semibold text-center">登录账号</h2>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              邮箱
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@moedesk.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              密码
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          {state.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {state.error}
            </div>
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
