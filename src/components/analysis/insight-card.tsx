import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface InsightCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function InsightCard({ title, icon, children }: InsightCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        {icon}
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
