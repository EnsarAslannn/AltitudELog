import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AxiosMockAdapter from 'axios-mock-adapter'
import { MemoryRouter } from 'react-router-dom'
import { ChatAssistant } from './ChatAssistant'
import { apiClient } from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import { useChatStore } from '../../store/chatStore'
import { useLanguageStore } from '../../i18n'
import type { AuthResponseDto } from '../../types/auth'

const authResponse: AuthResponseDto = {
  token: 'jwt-token',
  expiresAtUtc: '2026-10-01T00:00:00Z',
  refreshTokenExpiresAtUtc: '2026-10-08T00:00:00Z',
  pilotId: 'pilot-1',
  rank: 'Captain',
  refreshToken: 'refresh-token',
}

function renderAssistant() {
  return render(
    <MemoryRouter>
      <ChatAssistant />
    </MemoryRouter>,
  )
}

describe('ChatAssistant', () => {
  const mock = new AxiosMockAdapter(apiClient)

  beforeEach(() => {
    mock.reset()
    window.history.replaceState({}, '', '/')
    localStorage.clear()
    useChatStore.getState().reset()
    useAuthStore.getState().logout()
    useLanguageStore.setState({ language: 'tr' })
  })

  it('opens an accessible panel and restores focus to the launcher when closed', async () => {
    const user = userEvent.setup()
    renderAssistant()

    const launcher = screen.getByRole('button', { name: 'AltitudELog asistanını aç' })
    await user.click(launcher)

    const dialog = screen.getByRole('dialog', { name: 'AltitudELog asistanı' })
    expect(within(dialog).getByLabelText('Mesajınız')).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'Yeni sohbet' }))
    expect(within(dialog).getByLabelText('Mesajınız')).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(launcher).toHaveFocus()
  })

  it('sends recent messages as history and renders sources and predefined suggestions', async () => {
    const requests: unknown[] = []
    mock.onPost('/api/chat').reply((config) => {
      requests.push(JSON.parse(config.data))
      return [
        200,
        {
          answer: 'METAR bilgisi uçuş kaydından sonra otomatik alınır.',
          sources: [{ title: 'Operasyon yetenekleri', url: '/#yetenekler' }],
          suggestions: ['METAR bilgisini nerede görebilirim?'],
          usedAi: false,
        },
      ]
    })
    const user = userEvent.setup()
    renderAssistant()

    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))
    await user.type(screen.getByLabelText('Mesajınız'), 'METAR nasıl çalışır?')
    await user.click(screen.getByRole('button', { name: 'Gönder' }))

    expect(await screen.findByText(/METAR bilgisi uçuş kaydından sonra/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Operasyon yetenekleri' })).toHaveAttribute(
      'href',
      '/#yetenekler',
    )
    expect(screen.getByRole('button', { name: 'METAR bilgisini nerede görebilirim?' })).toBeInTheDocument()
    expect(requests[0]).toEqual({ message: 'METAR nasıl çalışır?', language: 'tr', history: [] })

    await user.type(screen.getByLabelText('Mesajınız'), 'Nerede görürüm?')
    await user.click(screen.getByRole('button', { name: 'Gönder' }))

    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[1]).toMatchObject({
      message: 'Nerede görürüm?',
      language: 'tr',
      history: [
        { role: 'user', content: 'METAR nasıl çalışır?' },
        { role: 'assistant', content: 'METAR bilgisi uçuş kaydından sonra otomatik alınır.' },
      ],
    })
  })

  it('offers a supported question guide instead of the flight-filter starter', async () => {
    mock.onPost('/api/chat').reply(200, {
      answer: 'Uçuş, mürettebat, CRM, METAR ve logbook hakkında soru sorabilirsiniz.',
      sources: [{ title: 'AltitudELog genel bakış', url: '/' }],
      suggestions: ['Otomatik METAR nasıl çalışır?'],
      usedAi: false,
    })
    const user = userEvent.setup()
    renderAssistant()

    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))

    expect(screen.queryByRole('button', { name: 'Uçuşları nasıl filtrelerim?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hangi soruları sorabilirim?' }))

    expect(await screen.findByText('Hangi soruları sorabilirim?')).toBeInTheDocument()
    expect(await screen.findByText(/Uçuş, mürettebat, CRM, METAR/)).toBeInTheDocument()
  })

  it('shows account-specific shortcuts only to signed-in users', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAssistant()
    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))

    expect(screen.queryByRole('link', { name: 'Yeni uçuş oluştur' })).not.toBeInTheDocument()

    unmount()
    useAuthStore.getState().login(authResponse, 'captain')
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))

    expect(screen.getByRole('link', { name: 'Yeni uçuş oluştur' })).toHaveAttribute('href', '/flights/new')
  })

  it('uses the authenticated personal chat endpoint for signed-in users', async () => {
    mock.onPost('/api/chat/personal').reply(200, {
      answer: 'Bu ay 2 saat 30 dakika uçtunuz.',
      sources: [{ title: 'Pilot profilim', url: '/pilots/pilot-1' }],
      suggestions: [],
      usedAi: false,
    })
    useAuthStore.getState().login(authResponse, 'captain')
    const user = userEvent.setup()
    renderAssistant()

    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))
    await user.type(screen.getByLabelText('Mesajınız'), 'Bu ay kaç saat uçtum?')
    await user.click(screen.getByRole('button', { name: 'Gönder' }))

    expect(await screen.findByText('Bu ay 2 saat 30 dakika uçtunuz.')).toBeInTheDocument()
    expect(mock.history.post).toHaveLength(1)
    expect(mock.history.post[0].url).toBe('/api/chat/personal')
  })

  it('sends the current flight page as bounded chat context', async () => {
    const flightId = '8f5ca72b-2b9f-4c74-85b6-cb3d8ee6e671'
    window.history.replaceState({}, '', `/flights/${flightId}`)
    mock.onPost('/api/chat/personal').reply(200, {
      answer: 'Bu uçuş için kaydedilen METAR: LTAC 201250Z 03008KT CAVOK.',
      sources: [{ title: 'Mevcut uçuş', url: `/flights/${flightId}` }],
      suggestions: [],
      usedAi: false,
    })
    useAuthStore.getState().login(authResponse, 'captain')
    const user = userEvent.setup()
    renderAssistant()

    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))
    expect(screen.getByRole('button', { name: 'Bu uçuşu özetle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bu uçuşun METAR kaydını göster' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Mesajınız'), 'Bu METAR kaydı ne?')
    await user.click(screen.getByRole('button', { name: 'Gönder' }))

    await screen.findByText(/Bu uçuş için kaydedilen METAR/)
    expect(JSON.parse(mock.history.post[0].data)).toMatchObject({
      context: { page: 'flight', entityId: flightId },
    })
  })

  it('submits helpful feedback for a tracked assistant response', async () => {
    const interactionId = '4a249db8-844d-47de-8890-04672e722ca8'
    mock.onPost('/api/chat').reply(200, {
      answer: 'Otomatik METAR uçuş kaydından sonra alınır.',
      sources: [],
      suggestions: [],
      usedAi: false,
      isAnswered: true,
      interactionId,
    })
    mock.onPost(`/api/chat/feedback/${interactionId}`).replyOnce(500)
    mock.onPost(`/api/chat/feedback/${interactionId}`).reply(204)
    const user = userEvent.setup()
    renderAssistant()

    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))
    await user.type(screen.getByLabelText('Mesajınız'), 'METAR nasıl çalışır?')
    await user.click(screen.getByRole('button', { name: 'Gönder' }))
    await screen.findByText('Otomatik METAR uçuş kaydından sonra alınır.')

    const helpful = screen.getByRole('button', { name: 'Yanıt yararlı' })
    await user.click(helpful)

    await waitFor(() => expect(helpful).not.toBeDisabled())
    expect(helpful).toHaveAttribute('aria-pressed', 'false')
    await user.click(helpful)

    await waitFor(() => expect(helpful).toHaveAttribute('aria-pressed', 'true'))
    const feedbackRequests = mock.history.post.filter((request) => request.url?.includes('/feedback/'))
    expect(feedbackRequests).toHaveLength(2)
    expect(JSON.parse(feedbackRequests[1].data)).toEqual({ helpful: true })
  })

  it('requires confirmation before clearing all conversations', async () => {
    const user = userEvent.setup()
    renderAssistant()
    await user.click(screen.getByRole('button', { name: 'AltitudELog asistanını aç' }))

    await user.click(screen.getByRole('button', { name: 'Konuşmalar' }))
    await user.click(screen.getByRole('button', { name: 'Tüm konuşmaları temizle' }))

    const alert = screen.getByRole('alertdialog', { name: 'Tüm konuşmaları temizle' })
    expect(within(alert).getByText(/geri alınamaz/)).toBeInTheDocument()
    await user.click(within(alert).getByRole('button', { name: 'Vazgeç' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})
