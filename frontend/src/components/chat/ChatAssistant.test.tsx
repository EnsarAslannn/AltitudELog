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
