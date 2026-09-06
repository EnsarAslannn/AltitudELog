import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageToggle } from './LanguageToggle'
import { Pagination } from './Pagination'
import { useLanguageStore } from '../../i18n'

describe('LanguageToggle', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'tr' })
  })

  it('opens in Turkish, the default', () => {
    render(<LanguageToggle />)

    expect(screen.getByRole('button', { name: 'TR' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches the interface to English and back', async () => {
    const user = userEvent.setup()
    render(
      <>
        <LanguageToggle />
        <Pagination pageNumber={1} totalPages={3} onPageChange={() => {}} />
      </>,
    )

    expect(screen.getByRole('button', { name: 'Sonraki' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.lang).toBe('en')

    await user.click(screen.getByRole('button', { name: 'TR' }))

    expect(screen.getByRole('button', { name: 'Sonraki' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('tr')
  })

  it('interpolates parameters into the active language', async () => {
    const user = userEvent.setup()
    render(
      <>
        <LanguageToggle />
        <Pagination pageNumber={2} totalPages={7} onPageChange={() => {}} />
      </>,
    )

    expect(screen.getByText('Sayfa 2 / 7')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'EN' }))

    expect(screen.getByText('Page 2 of 7')).toBeInTheDocument()
  })
})
