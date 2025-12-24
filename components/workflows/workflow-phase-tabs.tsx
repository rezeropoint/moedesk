"use client"

/**
 * 工作流阶段标签页组件
 */

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowTable } from "./workflow-table"
import { PHASE_CONFIG } from "@/lib/n8n"
import type { WorkflowDisplayItem, SOPPhase } from "@/types/workflow"

interface WorkflowPhaseTabsProps {
  workflows: WorkflowDisplayItem[]
}

type PhaseTab = SOPPhase | "all"

export function WorkflowPhaseTabs({ workflows }: WorkflowPhaseTabsProps) {
  const [activePhase, setActivePhase] = useState<PhaseTab>("all")

  const phases: PhaseTab[] = [
    "all",
    "content_production",
    "content_distribution",
    "user_interaction",
    "conversion_loop",
  ]

  const filteredWorkflows =
    activePhase === "all"
      ? workflows
      : workflows.filter((w) => w.phase === activePhase)

  const getPhaseCount = (phase: PhaseTab) =>
    phase === "all"
      ? workflows.length
      : workflows.filter((w) => w.phase === phase).length

  const getPhaseLabel = (phase: PhaseTab) => {
    if (phase === "all") return "全部"
    return PHASE_CONFIG[phase].label
  }

  const handleTabChange = (value: string) => {
    setActivePhase(value as PhaseTab)
  }

  return (
    <Tabs
      value={activePhase}
      onValueChange={handleTabChange}
      className="space-y-4"
    >
      <TabsList className="h-auto flex-wrap gap-2 bg-transparent p-0">
        {phases.map((phase) => (
          <TabsTrigger
            key={phase}
            value={phase}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {getPhaseLabel(phase)} ({getPhaseCount(phase)})
          </TabsTrigger>
        ))}
      </TabsList>

      {phases.map((phase) => (
        <TabsContent key={phase} value={phase} className="m-0">
          {phase !== "all" && (
            <p className="text-sm text-muted-foreground mb-4">
              {PHASE_CONFIG[phase].description}
            </p>
          )}
          <WorkflowTable workflows={filteredWorkflows} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
