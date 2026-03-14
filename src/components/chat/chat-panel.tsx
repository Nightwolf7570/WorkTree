"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/chat-store";
import { processUserMessage, generateFallbackResponse } from "@/lib/ai-chat";
import { ChatMessage } from "./chat-message";
import { Send, Bot, Trash2 } from "lucide-react";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, isTyping, addMessage, setIsTyping, clearMessages } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    const el = scrollRef.current;
    if (el) {
      // ScrollArea renders a viewport child
      const viewport = el.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput("");
    addMessage({
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    });

    setIsTyping(true);

    // Simulate AI thinking delay
    const delay = 600 + Math.random() * 800;
    await new Promise((r) => setTimeout(r, delay));

    const parsed = processUserMessage(text);
    if (parsed) {
      parsed.execute();
      addMessage({
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: parsed.response,
        timestamp: Date.now(),
        treeAction: parsed.action,
      });
    } else {
      const fallback = generateFallbackResponse(text);
      addMessage({
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: fallback,
        timestamp: Date.now(),
      });
    }

    setIsTyping(false);
    inputRef.current?.focus();
  }, [input, isTyping, addMessage, setIsTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">WorkTree AI</p>
            <p className="text-[11px] text-muted-foreground">
              Describe your team to build the tree
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={clearMessages}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Tell me about your company
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[260px]">
                  Describe your team structure and I&apos;ll build a living tree
                  visualization. Try:
                </p>
              </div>
              <div className="space-y-1.5 w-full">
                {[
                  "We have 3 engineers",
                  "Add Sarah Chen as a Senior Designer",
                  "We need a DevOps engineer",
                  "Create a Legal department",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    &ldquo;{suggestion}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </div>
              WorkTree AI is thinking
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your team..."
            disabled={isTyping}
            className="text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
