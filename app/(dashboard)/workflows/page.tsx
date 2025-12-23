import { Settings } from "lucide-react"

export default function WorkflowsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">工作流配置</h1>
          <p className="text-muted-foreground">管理 n8n 自动化工作流</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-12 text-center">
        <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">暂无工作流</h2>
        <p className="text-muted-foreground">
          配置 n8n 后，工作流将显示在这里
        </p>
      </div>
    </div>
  )
}
