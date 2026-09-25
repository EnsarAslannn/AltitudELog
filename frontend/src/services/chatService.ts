import { apiClient } from '../lib/axios'
import type { ChatRequest, ChatResponse } from '../types/chat'

export const chatService = {
  async ask(request: ChatRequest, usePersonalData = false): Promise<ChatResponse> {
    const endpoint = usePersonalData ? '/api/chat/personal' : '/api/chat'
    const response = await apiClient.post<ChatResponse>(endpoint, request)
    return response.data
  },
  async submitFeedback(interactionId: string, helpful: boolean): Promise<void> {
    await apiClient.post(`/api/chat/feedback/${interactionId}`, { helpful })
  },
}
