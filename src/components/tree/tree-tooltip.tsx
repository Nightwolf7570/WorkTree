"use client";

import type { PositionedTreeNode } from "@/types/tree";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Twitter, Globe } from "lucide-react";

interface TreeTooltipProps {
  node: PositionedTreeNode;
  containerZoom: number;
  containerPan: { x: number; y: number };
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-400",
  low: "bg-blue-500/15 text-blue-400",
};

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  website: Globe,
};

export function TreeTooltip({ node, containerZoom, containerPan }: TreeTooltipProps) {
  const x = (node.x + node.offsetX) * containerZoom + containerPan.x;
  const y = (node.y + node.offsetY) * containerZoom + containerPan.y;

  const hasSocials = node.socials && Object.keys(node.socials).length > 0;

  return (
    <div
      className="absolute z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 shadow-lg"
      style={{
        left: x,
        top: y - 14,
        maxWidth: 240,
        pointerEvents: hasSocials ? "auto" : "none",
      }}
    >
      <p className="text-sm font-medium text-foreground">{node.name}</p>
      {node.role && (
        <p className="mt-0.5 text-xs text-muted-foreground">{node.role}</p>
      )}
      {node.department && (
        <p className="mt-0.5 text-xs text-muted-foreground">{node.department}</p>
      )}
      {node.priority && (
        <Badge
          variant="secondary"
          className={`mt-1.5 text-[10px] ${priorityColors[node.priority] || ""}`}
        >
          {node.priority} priority
        </Badge>
      )}
      {hasSocials && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
          {(Object.entries(node.socials!) as [keyof typeof socialIcons, string][]).map(
            ([platform, url]) => {
              const Icon = socialIcons[platform];
              if (!Icon || !url) return null;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
