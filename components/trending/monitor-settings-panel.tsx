/**
 * 监测设置面板（占位）
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export function MonitorSettingsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4" />
          监测设置
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6 text-muted-foreground">
          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">监测设置功能开发中</p>
        </div>
      </CardContent>
    </Card>
  )
}
