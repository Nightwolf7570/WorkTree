"use client";

import { InsightCard } from "./insight-card";
import { DollarSign } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { BudgetSuggestion } from "@/types/analysis";

const COLORS = [
  "hsl(130, 30%, 40%)",
  "hsl(42, 55%, 52%)",
  "hsl(160, 30%, 42%)",
  "hsl(145, 35%, 45%)",
  "hsl(155, 25%, 38%)",
  "hsl(120, 28%, 42%)",
];

interface BudgetAllocationProps {
  data: BudgetSuggestion[];
}

export function BudgetAllocation({ data }: BudgetAllocationProps) {
  return (
    <InsightCard
      title="Suggested Budget Allocation"
      icon={<DollarSign className="h-5 w-5 text-[hsl(42,55%,52%)]" />}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="percentage"
              nameKey="department"
              label={({ name, value }: { name?: string; value?: number }) => `${name} ${value}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(200, 8%, 12%)",
                border: "1px solid hsl(200, 8%, 18%)",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(40, 10%, 90%)",
              }}
              formatter={(value, name) => [
                `${value}%`,
                String(name),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "hsl(40, 6%, 55%)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </InsightCard>
  );
}
