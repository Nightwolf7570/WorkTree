"use client";

import { motion } from "motion/react";
import { Bot, User, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/stores/chat-store";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground"
          )}
        >
          {message.content.split("\n").map((line, i) => (
            <span key={i}>
              {line.startsWith("- **") ? (
                <span>
                  {"- "}
                  <strong>{line.match(/\*\*(.+?)\*\*/)?.[1]}</strong>
                  {line.replace(/- \*\*.+?\*\*/, "")}
                </span>
              ) : line.startsWith("- ") ? (
                <span className="text-muted-foreground">{line}</span>
              ) : (
                line
              )}
              {i < message.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
        {message.treeAction && (
          <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <GitBranch className="h-3 w-3" />
            {message.treeAction.summary}
          </div>
        )}
      </div>
    </motion.div>
  );
}
