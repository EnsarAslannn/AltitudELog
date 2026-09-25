import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CHAT_STORAGE_KEY = 'altitudelog-chat'

export interface ChatSource {
  title: string
  url: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  sources?: ChatSource[]
  suggestions?: string[]
  isError?: boolean
  interactionId?: string
  isAnswered?: boolean
  feedback?: 'helpful' | 'unhelpful'
}

export interface ChatConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

interface NewMessage extends Omit<ChatMessage, 'id' | 'createdAt'> {}

interface ChatState {
  conversations: ChatConversation[]
  activeConversationId: string
  startConversation: () => string
  selectConversation: (id: string) => void
  addMessage: (conversationId: string, message: NewMessage) => void
  setMessageFeedback: (
    conversationId: string,
    messageId: string,
    feedback: 'helpful' | 'unhelpful',
  ) => void
  clearAll: () => void
  reset: () => void
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function emptyConversation(): ChatConversation {
  const now = new Date().toISOString()
  return {
    id: createId(),
    title: '',
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

const initialConversation = emptyConversation()

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [initialConversation],
      activeConversationId: initialConversation.id,
      startConversation: () => {
        const conversation = emptyConversation()
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
        }))
        return conversation.id
      },
      selectConversation: (id) => set({ activeConversationId: id }),
      addMessage: (conversationId, message) =>
        set((state) => {
          const now = new Date().toISOString()
          return {
            conversations: state.conversations.map((conversation) => {
              if (conversation.id !== conversationId) return conversation
              const title =
                conversation.title ||
                (message.role === 'user' ? message.content.trim().slice(0, 48) : conversation.title)
              return {
                ...conversation,
                title,
                updatedAt: now,
                messages: [
                  ...conversation.messages,
                  { ...message, id: createId(), createdAt: now },
                ],
              }
            }),
          }
        }),
      setMessageFeedback: (conversationId, messageId, feedback) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id !== conversationId
              ? conversation
              : {
                  ...conversation,
                  messages: conversation.messages.map((message) =>
                    message.id === messageId ? { ...message, feedback } : message,
                  ),
                },
          ),
        })),
      clearAll: () => {
        const conversation = emptyConversation()
        set({ conversations: [conversation], activeConversationId: conversation.id })
      },
      reset: () => {
        const conversation = emptyConversation()
        set({ conversations: [conversation], activeConversationId: conversation.id })
      },
    }),
    {
      name: CHAT_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    },
  ),
)
