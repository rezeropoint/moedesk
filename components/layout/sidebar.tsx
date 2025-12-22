"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Calendar,
  Flame,
  FileEdit,
  BarChart3,
  Settings,
  Users,
} from "lucide-react"
import { UserNav } from "./user-nav"
import type { SafeUser } from "@/types/auth"

interface SidebarProps {
  user: SafeUser
}

const navigation = [
  { name: "消息中心", href: "/inbox", icon: MessageSquare, badge: null },
  { name: "内容日历", href: "/content", icon: Calendar },
  { name: "热点雷达", href: "/trending", icon: Flame },
  { name: "内容审核", href: "/review", icon: FileEdit },
  { name: "数据报表", href: "/analytics", icon: BarChart3 },
  { name: "工作流配置", href: "/workflows", icon: Settings },
]

const adminNavigation = [
  { name: "用户管理", href: "/admin/users", icon: Users },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 bg-[#0f0f1a] text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <span className="text-2xl">🎌</span>
        <div>
          <h1 className="font-bold text-lg">MoeDesk</h1>
          <p className="text-xs text-gray-400">运营工作台 v1.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#7c3aed] text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {/* Admin Section */}
        {user.role === "ADMIN" && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                管理
              </p>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#7c3aed] text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-4">
        <UserNav user={user} />
      </div>
    </aside>
  )
}
