"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function DecorativeTree() {
  return (
    <svg
      width="280"
      height="320"
      viewBox="0 0 280 320"
      fill="none"
      className="opacity-80"
    >
      {/* Trunk */}
      <path
        d="M132 320 C132 300, 128 260, 134 230 L146 230 C152 260, 148 300, 148 320 Z"
        fill="hsl(25, 35%, 28%)"
      />
      {/* Main branches */}
      <path
        d="M140 230 C120 200, 60 180, 40 150"
        stroke="hsl(28, 30%, 33%)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M140 230 C160 200, 220 180, 240 150"
        stroke="hsl(28, 30%, 33%)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M140 230 C140 200, 140 160, 140 120"
        stroke="hsl(28, 30%, 33%)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sub branches */}
      <path d="M80 175 C65 155, 35 145, 25 125" stroke="hsl(140, 25%, 35%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M200 175 C215 155, 245 145, 255 125" stroke="hsl(140, 25%, 35%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M140 170 C115 150, 85 130, 70 105" stroke="hsl(140, 25%, 35%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M140 170 C165 150, 195 130, 210 105" stroke="hsl(140, 25%, 35%)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Leaves */}
      {[
        { cx: 40, cy: 148, color: "hsl(130, 30%, 40%)" },
        { cx: 25, cy: 122, color: "hsl(145, 35%, 45%)" },
        { cx: 52, cy: 130, color: "hsl(155, 25%, 38%)" },
        { cx: 240, cy: 148, color: "hsl(120, 28%, 42%)" },
        { cx: 255, cy: 122, color: "hsl(130, 30%, 40%)" },
        { cx: 228, cy: 130, color: "hsl(138, 32%, 43%)" },
        { cx: 70, cy: 103, color: "hsl(145, 35%, 45%)" },
        { cx: 58, cy: 90, color: "hsl(155, 25%, 38%)" },
        { cx: 85, cy: 95, color: "hsl(130, 30%, 40%)" },
        { cx: 210, cy: 103, color: "hsl(120, 28%, 42%)" },
        { cx: 225, cy: 90, color: "hsl(138, 32%, 43%)" },
        { cx: 195, cy: 95, color: "hsl(145, 35%, 45%)" },
        { cx: 140, cy: 118, color: "hsl(155, 25%, 38%)" },
        { cx: 128, cy: 105, color: "hsl(130, 30%, 40%)" },
        { cx: 152, cy: 105, color: "hsl(120, 28%, 42%)" },
        { cx: 140, cy: 90, color: "hsl(145, 35%, 45%)" },
      ].map((leaf, i) => (
        <ellipse
          key={i}
          cx={leaf.cx}
          cy={leaf.cy}
          rx={7 + (i % 3) * 1.5}
          ry={9 + (i % 4)}
          fill={leaf.color}
          opacity={0.8}
          transform={`rotate(${(i * 25) % 60 - 30} ${leaf.cx} ${leaf.cy})`}
        />
      ))}
      {/* Buds */}
      {[
        { cx: 35, cy: 135 },
        { cx: 245, cy: 135 },
        { cx: 140, cy: 80 },
      ].map((bud, i) => (
        <g key={`bud-${i}`}>
          <circle cx={bud.cx} cy={bud.cy} r={8} fill="hsl(42, 65%, 55%)" opacity={0.2} />
          <circle cx={bud.cx} cy={bud.cy} r={4} fill="hsl(42, 65%, 55%)" opacity={0.9} className="animate-bud-glow" />
        </g>
      ))}
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(160,30%,42%,0.06)_0%,_transparent_70%)]" />

      <motion.div
        className="relative flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <DecorativeTree />

        <div className="text-center">
          <h1 className="text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl">
            Grow your team with
            <br />
            <span className="font-semibold text-primary">clarity</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            AI-powered hiring intelligence that visualizes your company as a
            living tree. See where to plant your next hire for maximum growth.
          </p>
        </div>

        <Link href="/upload">
          <Button size="lg" className="gap-2 rounded-full px-6">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
