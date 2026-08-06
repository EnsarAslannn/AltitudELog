import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox, type ComboboxOption } from './Combobox'

const options: ComboboxOption[] = [
  { value: 'LTFM', label: 'LTFM', sublabel: 'İstanbul Havalimanı' },
  { value: 'LTFJ', label: 'LTFJ', sublabel: 'Sabiha Gökçen' },
  { value: 'EGLL', label: 'EGLL', sublabel: 'London Heathrow' },
]

function Harness({ errors }: { errors?: string[] }) {
  const [value, setValue] = useState('')

  return (
    <>
      <Combobox
        label="Kalkış (ICAO)"
        name="origin"
        value={value}
        onChange={setValue}
        options={options}
        errors={errors}
      />
      <button type="button">Sonraki alan</button>
    </>
  )
}

describe('Combobox', () => {
  it('filters options by code and by airport name', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('Kalkış (ICAO)'), 'heathrow')

    expect(screen.getByRole('option', { name: /EGLL/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /LTFM/ })).not.toBeInTheDocument()
  })

  it('points aria-activedescendant at the highlighted option while arrowing', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByLabelText('Kalkış (ICAO)')
    await user.click(input)
    await user.keyboard('{ArrowDown}')

    const activeId = input.getAttribute('aria-activedescendant')
    expect(activeId).toBeTruthy()

    const options = screen.getAllByRole('option')
    expect(document.getElementById(activeId!)).toBe(options[1])
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('opens the list on ArrowUp as well as ArrowDown', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByLabelText('Kalkış (ICAO)')
    input.focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('closes the list when focus leaves', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByLabelText('Kalkış (ICAO)'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.tab()

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects the highlighted option with Enter', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByLabelText('Kalkış (ICAO)')
    await user.click(input)
    await user.keyboard('{ArrowDown}{Enter}')

    expect(input).toHaveValue('LTFJ')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('associates the error message with the input', async () => {
    render(<Harness errors={['ICAO kodu 4 karakter olmalı.']} />)

    const input = screen.getByLabelText('Kalkış (ICAO)')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('ICAO kodu 4 karakter olmalı.')
  })
})
