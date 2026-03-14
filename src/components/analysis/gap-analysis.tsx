"use client";

import { InsightCard } from "./insight-card";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { GapAnalysis as GapAnalysisType } from "@/types/analysis";

interface GapAnalysisProps {
  data: GapAnalysisType[];
}

export function GapAnalysis({ data }: GapAnalysisProps) {
  return (
    <InsightCard
      title="Capacity Gap Analysis"
      icon={<BarChart3 className="h-5 w-5 text-primary" />}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 8%, 18%)" />
            <XAxis
              dataKey="department"
              tick={{ fill: "hsl(40, 6%, 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(200, 8%, 18%)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(40, 6%, 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(200, 8%, 18%)" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(200, 8%, 12%)",
                border: "1px solid hsl(200, 8%, 18%)",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(40, 10%, 90%)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "hsl(40, 6%, 55%)" }}
            />
            <Bar
              dataKey="currentCapacity"
              name="Current"
              fill="hsl(160, 30%, 42%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="requiredCapacity"
              name="Required"
              fill="hsl(42, 55%, 52%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </InsightCard>
  );
}
