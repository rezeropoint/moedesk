"use client"

import { useState, useTransition } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserCog, KeyRound, Ban, CheckCircle } from "lucide-react"
import { toggleUserStatus } from "@/app/(dashboard)/admin/users/actions"
import { EditUserDialog } from "./edit-user-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"

interface User {
  id: string
  email: string
  name: string
  role: "ADMIN" | "OPERATOR"
  isActive: boolean
  createdAt: Date
  lastLoginAt: Date | null
}

interface UserTableProps {
  users: User[]
  currentUserId: string
}

export function UserTable({ users, currentUserId }: UserTableProps) {
  const [editUser, setEditUser] = useState<User | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleToggleStatus = (user: User) => {
    startTransition(async () => {
      await toggleUserStatus(user.id)
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead className="w-[70px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {user.role === "ADMIN" ? "管理员" : "运营"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "outline" : "destructive"}>
                    {user.isActive ? "正常" : "已禁用"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.lastLoginAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditUser(user)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        编辑用户
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResetUser(user)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        重置密码
                      </DropdownMenuItem>
                      {user.id !== currentUserId && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user)}
                            disabled={isPending}
                            className={
                              user.isActive ? "text-destructive" : "text-green-600"
                            }
                          >
                            {user.isActive ? (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                禁用账号
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                启用账号
                              </>
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      />

      <ResetPasswordDialog
        user={resetUser}
        open={!!resetUser}
        onOpenChange={(open) => !open && setResetUser(null)}
      />
    </>
  )
}
