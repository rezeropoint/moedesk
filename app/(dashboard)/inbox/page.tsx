import { MessageSquare } from "lucide-react"

export default function InboxPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#7c3aed]/10 rounded-lg">
          <MessageSquare className="h-6 w-6 text-[#7c3aed]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">消息中心</h1>
          <p className="text-muted-foreground">统一管理多平台社媒消息</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">暂无消息</h2>
        <p className="text-muted-foreground">
          连接社媒平台后，消息将显示在这里
        </p>
      </div>
    </div>
  )
}
