/**
 * 热点产品匹配面板（占位）
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"

export function ProductMatchPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          热点产品匹配
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6 text-muted-foreground">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">产品匹配功能开发中</p>
        </div>
      </CardContent>
    </Card>
  )
}
