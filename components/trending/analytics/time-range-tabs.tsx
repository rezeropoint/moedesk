"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TimeRange } from "@/types/analytics"

interface TimeRangeTabsProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

export function TimeRangeTabs({ value, onChange }: TimeRangeTabsProps) {
  return (
    <Tabs
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as TimeRange)}
    >
      <TabsList>
        <TabsTrigger value="7">7 天</TabsTrigger>
        <TabsTrigger value="30">30 天</TabsTrigger>
        <TabsTrigger value="90">90 天</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
