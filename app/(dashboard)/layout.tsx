import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { Sidebar } from "@/components/layout/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const safeUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    avatar: session.user.avatar,
    isActive: session.user.isActive,
    createdAt: session.user.createdAt,
    updatedAt: session.user.updatedAt,
    lastLoginAt: session.user.lastLoginAt,
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Sidebar user={safeUser} />
      <main className="pl-60">{children}</main>
    </div>
  )
}
