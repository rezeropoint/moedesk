import { FileEdit } from "lucide-react"

export default function ReviewPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileEdit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">内容审核</h1>
          <p className="text-muted-foreground">审核待发布的社媒内容</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-12 text-center">
        <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">暂无待审核内容</h2>
        <p className="text-muted-foreground">
          AI 生成的内容将在这里等待审核
        </p>
      </div>
    </div>
  )
}
