import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import { useLanguageStore } from '../../i18n'

function Boom(): never {
  throw new Error('render exploded')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs the caught error itself, and the boundary logs its own; neither is a test failure.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useLanguageStore.setState({ language: 'tr' })
  })

  it('renders its children while nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('shows a recoverable fallback instead of a blank page when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Bir şeyler ters gitti')
    expect(screen.getByRole('button', { name: 'Sayfayı yenile' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Uçuşlara dön' })).toBeInTheDocument()
  })

  it('renders the fallback in the active language', () => {
    useLanguageStore.setState({ language: 'en' })

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  })
})
