import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth/session"
import { UserTable } from "@/components/users/user-table"
import { AddUserDialog } from "@/components/users/add-user-dialog"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"

export default async function UsersPage() {
  const session = await getSession()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/inbox")
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">用户管理</h1>
            <p className="text-muted-foreground">管理系统用户和权限</p>
          </div>
        </div>
        <AddUserDialog>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            添加用户
          </Button>
        </AddUserDialog>
      </div>

      <UserTable users={users} currentUserId={session.user.id} />
    </div>
  )
}
