import { beforeEach, describe, expect, it } from 'vitest'
import { CHAT_STORAGE_KEY, useChatStore } from './chatStore'

describe('chatStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useChatStore.getState().reset()
  })

  it('keeps multiple conversations and restores them from localStorage', () => {
    const firstId = useChatStore.getState().activeConversationId
    useChatStore.getState().addMessage(firstId, {
      role: 'user',
      content: 'METAR nasıl çalışır?',
    })

    const secondId = useChatStore.getState().startConversation()
    useChatStore.getState().addMessage(secondId, {
      role: 'user',
      content: 'Logbook nasıl indirilir?',
    })

    const persisted = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) ?? '{}')

    expect(useChatStore.getState().conversations).toHaveLength(2)
    expect(persisted.state.conversations).toHaveLength(2)
    expect(useChatStore.getState().activeConversationId).toBe(secondId)
  })

  it('clears every conversation and starts with one empty conversation', () => {
    useChatStore.getState().startConversation()

    useChatStore.getState().clearAll()

    const state = useChatStore.getState()
    expect(state.conversations).toHaveLength(1)
    expect(state.conversations[0].messages).toEqual([])
    expect(state.activeConversationId).toBe(state.conversations[0].id)
  })
})
