import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  History,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useLanguage, useT } from '../../i18n'
import { chatService } from '../../services/chatService'
import { useAuthStore } from '../../store/authStore'
import { useChatStore, type ChatConversation, type ChatMessage } from '../../store/chatStore'
import { hasCommandRank } from '../../routes/ranks'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'

const MAX_HISTORY_MESSAGES = 8

function conversationLabel(conversation: ChatConversation, fallback: string) {
  return conversation.title || fallback
}

function messageHistory(messages: ChatMessage[]) {
  return messages
    .filter((message) => !message.isError)
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content }))
}

export function ChatAssistant() {
  const t = useT()
  const language = useLanguage()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const rank = useAuthStore((state) => state.rank)
  const pilotId = useAuthStore((state) => state.pilotId)
  const conversations = useChatStore((state) => state.conversations)
  const activeConversationId = useChatStore((state) => state.activeConversationId)
  const startConversation = useChatStore((state) => state.startConversation)
  const selectConversation = useChatStore((state) => state.selectConversation)
  const addMessage = useChatStore((state) => state.addMessage)
  const clearAll = useChatStore((state) => state.clearAll)

  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)

  const launcherRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const clearButtonRef = useRef<HTMLButtonElement>(null)
  const cancelClearRef = useRef<HTMLButtonElement>(null)
  const confirmClearRef = useRef<HTMLDivElement>(null)

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      conversations[0],
    [activeConversationId, conversations],
  )

  useEffect(() => {
    if (!isOpen) return
    inputRef.current?.focus()
  }, [isOpen, view])

  useEffect(() => {
    if (isOpen && view === 'chat') {
      messagesEndRef.current?.scrollIntoView?.({ block: 'nearest' })
    }
  }, [activeConversation?.messages.length, isOpen, view])

  useEffect(() => {
    if (showClearConfirmation) {
      cancelClearRef.current?.focus()
    }
  }, [showClearConfirmation])

  function closePanel() {
    setIsOpen(false)
    setShowClearConfirmation(false)
    launcherRef.current?.focus()
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePanel()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function handleNewConversation() {
    if (activeConversation?.messages.length) {
      startConversation()
    }
    setInput('')
    setView('chat')
    inputRef.current?.focus()
  }

  function closeClearConfirmation() {
    setShowClearConfirmation(false)
    requestAnimationFrame(() => clearButtonRef.current?.focus())
  }

  function handleClearDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      closeClearConfirmation()
      return
    }

    if (event.key !== 'Tab' || !confirmClearRef.current) return
    const focusable = Array.from(
      confirmClearRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function sendMessage(content: string) {
    const message = content.trim()
    if (!message || isSending || !activeConversation) return

    const conversationId = activeConversation.id
    const history = messageHistory(activeConversation.messages)
    addMessage(conversationId, { role: 'user', content: message })
    setInput('')
    setIsSending(true)

    try {
      const response = await chatService.ask({ message, language, history }, isAuthenticated)
      addMessage(conversationId, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        suggestions: response.suggestions.slice(0, 3),
      })
    } catch {
      addMessage(conversationId, {
        role: 'assistant',
        content: t('chat.error'),
        isError: true,
      })
    } finally {
      setIsSending(false)
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage(input)
    }
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-label={t('chat.open')}
        aria-expanded={isOpen}
        aria-controls="altitudelog-assistant"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'fixed bottom-5 right-5 z-[70] inline-flex h-14 items-center gap-2 rounded-xl bg-primary px-4 text-on-primary shadow-[var(--shadow-panel-hover)] transition-transform',
          'hover:-translate-y-0.5 active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/35',
          isOpen && 'pointer-events-none scale-95 opacity-0',
        )}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
        <span className="hidden text-sm font-semibold sm:inline">{t('chat.shortName')}</span>
      </button>

      {isOpen && (
        <div
          id="altitudelog-assistant"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-assistant-title"
          onKeyDown={handleDialogKeyDown}
          className="fixed inset-x-3 bottom-3 z-[70] flex h-[min(520px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest text-on-surface shadow-[var(--shadow-panel-hover)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(480px,calc(100dvh-2.5rem))] sm:w-[min(340px,calc(100vw-2.5rem))]"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/70 bg-primary px-4 py-3 text-on-primary">
            <div className="flex min-w-0 items-center gap-3">
              {view === 'history' ? (
                <button
                  type="button"
                  onClick={() => setView('chat')}
                  aria-label={t('chat.back')}
                  className="rounded p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12">
                  <Bot className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
                </span>
              )}
              <div className="min-w-0">
                <h2 id="chat-assistant-title" className="truncate text-sm font-semibold">
                  {view === 'history' ? t('chat.conversations') : t('chat.name')}
                </h2>
                {view === 'chat' && <p className="text-xs text-white/75">{t('chat.localOnly')}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {view === 'chat' && (
                <>
                  <button
                    type="button"
                    onClick={handleNewConversation}
                    aria-label={t('chat.new')}
                    className="rounded p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('history')}
                    aria-label={t('chat.conversations')}
                    className="rounded p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={closePanel}
                aria-label={t('chat.close')}
                className="rounded p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          {view === 'history' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="grid gap-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        selectConversation(conversation.id)
                        setView('chat')
                      }}
                      className={cn(
                        'w-full rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/25',
                        conversation.id === activeConversationId
                          ? 'border-primary bg-secondary-container'
                          : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low',
                      )}
                    >
                      <span className="block truncate text-sm font-semibold">
                        {conversationLabel(conversation, t('chat.emptyConversation'))}
                      </span>
                      <span className="mt-1 block text-xs text-on-surface-variant">
                        {new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(conversation.updatedAt))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-outline-variant p-3">
                <Button
                  ref={clearButtonRef}
                  variant="ghost"
                  icon={Trash2}
                  onClick={() => setShowClearConfirmation(true)}
                  className="w-full text-error hover:bg-error-container hover:text-on-error-container"
                >
                  {t('chat.clearAll')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className="min-h-0 flex-1 overflow-y-auto bg-surface-container-low p-4"
                aria-live="polite"
                aria-busy={isSending}
              >
                <div className="grid gap-4">
                  {!activeConversation?.messages.length && (
                    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                      <p className="text-sm font-semibold">{t('chat.welcomeTitle')}</p>
                      <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                        {t('chat.welcomeBody')}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[t('chat.starter.guide'), t('chat.starter.metar'), t('chat.starter.crm')].map(
                          (suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => void sendMessage(suggestion)}
                              className="rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-left text-xs font-medium text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/25"
                            >
                              {suggestion}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {activeConversation?.messages.map((message) => (
                    <article
                      key={message.id}
                      className={cn(
                        'max-w-[88%] rounded-lg px-3.5 py-3 text-sm leading-relaxed',
                        message.role === 'user'
                          ? 'ml-auto bg-primary text-on-primary'
                          : 'mr-auto border border-outline-variant bg-surface-container-lowest text-on-surface',
                        message.isError && 'border-error/40 bg-error-container text-on-error-container',
                      )}
                    >
                      <p>{message.content}</p>
                      {!!message.sources?.length && (
                        <div className="mt-3 border-t border-outline-variant pt-2">
                          <p className="text-xs font-semibold text-on-surface-variant">{t('chat.sources')}</p>
                          <div className="mt-1 grid gap-1">
                            {message.sources.map((source) => (
                              <a
                                key={`${source.url}-${source.title}`}
                                href={source.url}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-action underline decoration-action/35 underline-offset-4 hover:decoration-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue/40"
                              >
                                {source.title}
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {!!message.suggestions?.length && (
                        <div className="mt-3 flex flex-wrap gap-1.5" aria-label={t('chat.suggestions')}>
                          {message.suggestions.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => void sendMessage(suggestion)}
                              className="rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-left text-xs font-medium text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/25"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}

                  {isSending && (
                    <div className="mr-auto rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface-variant motion-safe:animate-pulse">
                      {t('chat.thinking')}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {isAuthenticated && (
                <nav
                  aria-label={t('chat.accountShortcuts')}
                  className="flex shrink-0 gap-2 overflow-x-auto border-t border-outline-variant bg-surface-container-lowest px-3 py-2 [scrollbar-width:none]"
                >
                  <a
                    href="/dashboard"
                    className="shrink-0 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/25"
                  >
                    {t('chat.shortcut.flights')}
                  </a>
                  {pilotId && (
                    <a
                      href={`/pilots/${pilotId}`}
                      className="shrink-0 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/25"
                    >
                      {t('chat.shortcut.profile')}
                    </a>
                  )}
                  {hasCommandRank(rank) && (
                    <a
                      href="/flights/new"
                      className="shrink-0 rounded-full border border-outline-variant px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/25"
                    >
                      {t('chat.shortcut.newFlight')}
                    </a>
                  )}
                </nav>
              )}

              <form
                className="shrink-0 border-t border-outline-variant bg-surface-container-lowest p-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendMessage(input)
                }}
              >
                <label htmlFor="chat-message" className="sr-only">
                  {t('chat.messageLabel')}
                </label>
                <div className="flex items-end gap-2">
                  <textarea
                    id="chat-message"
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    rows={1}
                    maxLength={500}
                    disabled={isSending}
                    placeholder={t('chat.placeholder')}
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-lg border border-outline bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-4 focus:ring-signal-blue/20 disabled:opacity-60"
                  />
                  <Button
                    type="submit"
                    aria-label={t('chat.send')}
                    disabled={!input.trim() || isSending}
                    className="h-11 w-11 shrink-0 px-0"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-on-surface-variant">{t('chat.privacy')}</p>
              </form>
            </>
          )}

          {showClearConfirmation && (
            <div className="absolute inset-0 z-10 flex items-end bg-primary/30 p-4 sm:items-center">
              <div
                ref={confirmClearRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="clear-chat-title"
                aria-describedby="clear-chat-description"
                onKeyDown={handleClearDialogKeyDown}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-[var(--shadow-panel-hover)]"
              >
                <h3 id="clear-chat-title" className="text-base font-semibold">
                  {t('chat.clearAll')}
                </h3>
                <p id="clear-chat-description" className="mt-2 text-sm text-on-surface-variant">
                  {t('chat.clearConfirmBody')}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <Button ref={cancelClearRef} variant="secondary" onClick={closeClearConfirmation}>
                    {t('chat.cancel')}
                  </Button>
                  <Button
                    onClick={() => {
                      clearAll()
                      setShowClearConfirmation(false)
                      setView('chat')
                    }}
                    className="bg-error text-on-error hover:bg-error-hover"
                  >
                    {t('chat.clear')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
