export type ChatRole = 'user' | 'assistant'

export interface ChatHistoryMessage {
  role: ChatRole
  content: string
}

export interface ChatRequest {
  message: string
  language: 'tr' | 'en'
  history: ChatHistoryMessage[]
  context?: ChatPageContext
}

export type ChatPage = 'flight' | 'pilot' | 'dashboard' | 'safety-reports' | 'admin-stats'

export interface ChatPageContext {
  page: ChatPage
  entityId?: string
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
  isAnswered: boolean
  interactionId?: string
}
