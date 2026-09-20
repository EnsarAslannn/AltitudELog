export type ChatRole = 'user' | 'assistant'

export interface ChatHistoryMessage {
  role: ChatRole
  content: string
}

export interface ChatRequest {
  message: string
  language: 'tr' | 'en'
  history: ChatHistoryMessage[]
}

export interface ChatSource {
  title: string
  url: string
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
  suggestions: string[]
  usedAi: boolean
}
