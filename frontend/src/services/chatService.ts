import { apiClient } from '../lib/axios'
import type { ChatRequest, ChatResponse } from '../types/chat'

export const chatService = {
  async ask(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/api/chat', request)
    return response.data
  },
}
