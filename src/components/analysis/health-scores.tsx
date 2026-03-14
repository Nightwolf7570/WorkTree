"use client";

import { InsightCard } from "./insight-card";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";
import type { DepartmentHealth } from "@/types/analysis";

interface HealthScoresProps {
  data: DepartmentHealth[];
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function getStatusLabel(status: DepartmentHealth["status"]): string {
  switch (status) {
    case "understaffed": return "Understaffed";
    case "optimal": return "Optimal";
    case "overstaffed": return "Overstaffed";
  }
}

export function HealthScores({ data }: HealthScoresProps) {
  return (
    <InsightCard
      title="Department Health"
      icon={<Activity className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-4">
        {data.map((dept) => (
          <div key={dept.department}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{dept.department}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {dept.headcount}/{dept.optimalHeadcount} &middot; {getStatusLabel(dept.status)}
                </span>
                <span className={`text-xs font-semibold ${getScoreColor(dept.score)}`}>
                  {dept.score}%
                </span>
              </div>
            </div>
            <Progress value={dept.score} className="mt-1.5 h-2" />
          </div>
        ))}
      </div>
    </InsightCard>
  );
}
