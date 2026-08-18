import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingPage } from './LandingPage'
import { useAuthStore } from '../store/authStore'
import type { AuthResponseDto } from '../types/auth'

function renderLandingPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LandingPage />
    </MemoryRouter>,
  )
}

const authResponse: AuthResponseDto = {
  token: 'jwt-token',
  expiresAtUtc: '2026-08-01T00:00:00Z',
  pilotId: 'pilot-1',
  rank: 'Captain',
  refreshToken: 'refresh-token',
}

describe('LandingPage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('routes anonymous visitors to login and registration', () => {
    renderLandingPage()

    for (const link of screen.getAllByRole('link', { name: 'Giriş Yap' })) {
      expect(link).toHaveAttribute('href', '/login')
    }
    for (const link of screen.getAllByRole('link', { name: 'Hesap Oluştur' })) {
      expect(link).toHaveAttribute('href', '/register')
    }
    expect(screen.queryByRole('link', { name: 'Panele Git' })).not.toBeInTheDocument()
  })

  it('sends signed-in visitors to the dashboard instead of the auth pages', () => {
    useAuthStore.getState().login(authResponse, 'jdoe')

    renderLandingPage()

    for (const link of screen.getAllByRole('link', { name: 'Panele Git' })) {
      expect(link).toHaveAttribute('href', '/dashboard')
    }
    expect(screen.queryByRole('link', { name: 'Hesap Oluştur' })).not.toBeInTheDocument()
  })

  it('shows a feature block per product area, each with its screenshot', () => {
    renderLandingPage()

    const blocks = [
      { heading: /Kayıtlı tüm uçuşlar/, image: '/images/report2.png' },
      { heading: /Güvenlik verisi/, image: '/images/report1.png' },
      { heading: /Uçuş saatiniz/, image: '/images/report3.png' },
    ]

    for (const { heading, image } of blocks) {
      const section = screen.getByRole('heading', { level: 2, name: heading }).closest('section')
      expect(section).not.toBeNull()
      expect(within(section as HTMLElement).getByRole('img')).toHaveAttribute('src', image)
    }
  })

  it('runs one page-wide backdrop clip rather than a video per section', () => {
    // The hero and the display interlude used to own a <video> each. They are now
    // windows onto a single fixed backdrop, so a second element here would mean a
    // second decode for footage the reader experiences as one continuous sky.
    renderLandingPage()

    const videos = document.querySelectorAll('video')
    expect(videos).toHaveLength(1)
    expect(videos[0]).toHaveAttribute('src', '/videos/air-backdrop.mp4')
  })

  it('exposes every section the navigation links to', () => {
    // The panel this page replaced swallowed wheel events to drive an expanding
    // hero, so the landing page could not be scrolled past at all. These anchors
    // are the guarantee that ordinary scrolling has somewhere to arrive.
    renderLandingPage()

    for (const id of ['ucus-kaydi', 'crm', 'logbook', 'yetenekler']) {
      expect(document.getElementById(id)).toBeInTheDocument()
    }
  })

  it('marks each section with the tone the navigation recolours itself from', () => {
    renderLandingPage()

    const tones = [...document.querySelectorAll('[data-nav-tone]')].map((el) =>
      el.getAttribute('data-nav-tone'),
    )

    // The hero must be first and dark — it is the tone the bar starts on before
    // the observer has reported anything.
    expect(tones[0]).toBe('dark')
    expect(new Set(tones)).toEqual(new Set(['dark', 'blue', 'cream']))
    expect(document.querySelector('#crm')).toHaveAttribute('data-nav-tone', 'cream')
    expect(document.querySelector('#logbook')).toHaveAttribute('data-nav-tone', 'blue')
  })
})
