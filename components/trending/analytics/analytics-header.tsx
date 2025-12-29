"use client"

import Link from "next/link"
import { BarChart3, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnalyticsHeaderProps {
  onRefresh: () => void
  loading?: boolean
}

export function AnalyticsHeader({ onRefresh, loading }: AnalyticsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9">
          <Link href="/trending">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">热度分析</h1>
          <p className="text-sm text-muted-foreground">
            分析 IP 热度趋势和数据源贡献
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>
    </div>
  )
}
