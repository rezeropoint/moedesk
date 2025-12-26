/**
 * 即将完结番面板
 */

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

interface EndingSoonItem {
  id: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  endDate: string
  daysRemaining: number
}

interface EndingSoonPanelProps {
  items: EndingSoonItem[]
}

export function EndingSoonPanel({ items }: EndingSoonPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4" />
          即将完结
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无即将完结的番剧</p>
          </div>
        ) : (
          items.map((item) => {
            const title = item.titleChinese || item.titleOriginal

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                {/* 封面 */}
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🎬
                    </div>
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.endDate).toLocaleDateString("zh-CN")} 完结
                  </p>
                </div>

                {/* 剩余天数 */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0",
                    item.daysRemaining <= 7 && "bg-destructive/10 text-destructive",
                    item.daysRemaining > 7 &&
                      item.daysRemaining <= 14 &&
                      "bg-orange-100 text-orange-700"
                  )}
                >
                  {item.daysRemaining <= 0 ? "已完结" : `${item.daysRemaining}天`}
                </Badge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
