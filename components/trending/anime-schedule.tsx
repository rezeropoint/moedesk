/**
 * 本周新番面板
 */

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AnimeItem {
  id: string
  titleOriginal: string
  titleChinese: string | null
  coverImage: string | null
  metadata: {
    seasonYear?: number
    season?: string
    episodes?: number
  } | null
}

interface AnimeScheduleProps {
  items: AnimeItem[]
}

export function AnimeSchedule({ items }: AnimeScheduleProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          本周新番
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无本周新番数据
          </p>
        ) : (
          items.map((anime) => {
            const metadata = anime.metadata as {
              seasonYear?: number
              season?: string
              episodes?: number
            } | null

            return (
              <div
                key={anime.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                {/* 封面 */}
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                  {anime.coverImage ? (
                    <Image
                      src={anime.coverImage}
                      alt={anime.titleChinese || anime.titleOriginal}
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
                  <p className="font-medium text-sm truncate">
                    {anime.titleChinese || anime.titleOriginal}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metadata?.seasonYear} {metadata?.season}
                  </p>
                </div>

                {/* 集数 */}
                <Badge variant="secondary" className="shrink-0">
                  EP {metadata?.episodes || "?"}
                </Badge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
