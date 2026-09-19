import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sql?: string;
  explanation?: string;
  timestamp: string;
}

export type AIProvider = 'offline' | 'openai' | 'gemini' | 'ollama';

interface AIState {
  provider: AIProvider;
  apiKey: string;
  ollamaEndpoint: string;
  modelName: string;
  messages: AIMessage[];
  isGenerating: boolean;
  isOpen: boolean;

  setProvider: (p: AIProvider) => void;
  setApiKey: (key: string) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setModelName: (model: string) => void;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setGenerating: (generating: boolean) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      provider: 'offline',
      apiKey: '',
      ollamaEndpoint: 'http://localhost:11434',
      modelName: 'gpt-4o-mini',
      messages: [
        {
          id: 'welcome',
          sender: 'assistant',
          text: 'سلام! من دستیار هوشمند QueryBox هستم. چطور می‌توانم در ساخت کوئری، تحلیل اسکیما یا بهینه‌سازی دیتابیس به شما کمک کنم؟',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      isGenerating: false,
      isOpen: false,

      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setOllamaEndpoint: (ollamaEndpoint) => set({ ollamaEndpoint }),
      setModelName: (modelName) => set({ modelName }),
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...msg,
              id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        })),
      clearMessages: () =>
        set({
          messages: [
            {
              id: 'welcome',
              sender: 'assistant',
              text: 'گفتگو بازنشانی شد. کوئری جدید خود را بپرسید!',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        }),
      setGenerating: (isGenerating) => set({ isGenerating }),
    }),
    {
      name: 'querybox-ai-storage',
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        ollamaEndpoint: state.ollamaEndpoint,
        modelName: state.modelName,
      }),
    }
  )
);
