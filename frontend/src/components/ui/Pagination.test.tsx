import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(<Pagination pageNumber={1} totalPages={1} onPageChange={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the current page and total pages', () => {
    render(<Pagination pageNumber={2} totalPages={5} onPageChange={vi.fn()} />)

    expect(screen.getByText('Sayfa 2 / 5')).toBeInTheDocument()
  })

  it('disables "Önceki" on the first page and "Sonraki" on the last page', () => {
    const { rerender } = render(<Pagination pageNumber={1} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Önceki' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Sonraki/ })).toBeEnabled()

    rerender(<Pagination pageNumber={3} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Önceki' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Sonraki/ })).toBeDisabled()
  })

  it('calls onPageChange with the next/previous page number', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination pageNumber={2} totalPages={5} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: /Sonraki/ }))
    expect(onPageChange).toHaveBeenLastCalledWith(3)

    await user.click(screen.getByRole('button', { name: 'Önceki' }))
    expect(onPageChange).toHaveBeenLastCalledWith(1)
  })

  it('disables both buttons when disabled prop is set', () => {
    render(<Pagination pageNumber={2} totalPages={5} onPageChange={vi.fn()} disabled />)

    expect(screen.getByRole('button', { name: 'Önceki' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Sonraki/ })).toBeDisabled()
  })
})
