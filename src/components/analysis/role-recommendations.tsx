"use client";

import { Badge } from "@/components/ui/badge";
import { InsightCard } from "./insight-card";
import { Sparkles } from "lucide-react";
import type { RoleRecommendation } from "@/types/analysis";

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/20",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

interface RoleRecommendationsProps {
  recommendations: RoleRecommendation[];
}

export function RoleRecommendations({ recommendations }: RoleRecommendationsProps) {
  return (
    <InsightCard
      title="Role Recommendations"
      icon={<Sparkles className="h-5 w-5 text-[hsl(42,55%,52%)]" />}
    >
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="rounded-lg border border-border bg-muted/20 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {rec.title}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {rec.department}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] ${priorityColors[rec.priority] || ""}`}
              >
                {rec.priority}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {rec.reasoning}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {rec.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px]">
                    {skill}
                  </Badge>
                ))}
                {rec.skills.length > 3 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{rec.skills.length - 3}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                ${(rec.salaryRange.min / 1000).toFixed(0)}k–$
                {(rec.salaryRange.max / 1000).toFixed(0)}k
              </span>
            </div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}
