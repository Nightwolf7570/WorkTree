"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { TreePine, Brain, BarChart3 } from "lucide-react";

const features = [
  {
    icon: TreePine,
    title: "Living Org Tree",
    description:
      "Your company structure rendered as a beautiful botanical tree. Branches are departments, leaves are people, glowing buds are where to hire next.",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description:
      "Upload your pitch deck, org chart, or strategy docs. Our AI identifies gaps, recommends roles, and prioritizes hires by impact.",
  },
  {
    icon: BarChart3,
    title: "Hiring Dashboard",
    description:
      "Department health scores, capacity gap analysis, and budget allocation — all the data you need to make confident hiring decisions.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <Card className="border-border bg-card h-full">
              <CardContent className="pt-6">
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
