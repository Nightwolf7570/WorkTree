import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  treeAction?: TreeAction;
}

export interface TreeAction {
  type: "add_employees" | "add_department" | "add_team" | "add_recommended" | "set_company" | "remove_node";
  summary: string;
}

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: ChatMessage) => void;
  setIsTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isTyping: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setIsTyping: (typing) => set({ isTyping: typing }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "worktree-chat",
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
